import os, uuid, sqlite3, shutil, subprocess, zipfile, json, time
from pathlib import Path
from threading import Thread
from contextlib import contextmanager
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Request
from fastapi.responses import FileResponse

DATA = Path(os.getenv('DATA_DIR', '/data'))
JOBS = DATA / 'jobs'
DB = DATA / 'jobs.sqlite3'
TOKEN = os.getenv('MEDIA_API_TOKEN', '')
MAX_BYTES = int(os.getenv('MAX_UPLOAD_MB', '1024')) * 1024 * 1024
TIMEOUT = int(os.getenv('JOB_TIMEOUT_SECONDS', '21600'))
app = FastAPI(title='Hollywood Jailbreak Media Engine', version='0.1.0')
JOBS.mkdir(parents=True, exist_ok=True)

@contextmanager
def connect():
    c = sqlite3.connect(DB, timeout=30)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()

def init_db():
    with connect() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, operation TEXT NOT NULL,
          status TEXT NOT NULL, message TEXT NOT NULL, workdir TEXT NOT NULL,
          output_path TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        )''')
init_db()

def auth(authorization: str | None):
    if not TOKEN or authorization != f'Bearer {TOKEN}':
        raise HTTPException(401, 'Unauthorized media gateway request')

def run(cmd, cwd=None):
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=TIMEOUT)
    if p.returncode:
        detail = (p.stderr or p.stdout or 'Processing command failed')[-5000:]
        raise RuntimeError(detail)
    return p.stdout[-5000:]

def update_job(job_id, status, message, output_path=None):
    with connect() as c:
        c.execute('UPDATE jobs SET status=?, message=?, output_path=COALESCE(?,output_path), updated_at=? WHERE id=?',
                  (status, message[-5000:], str(output_path) if output_path else None, int(time.time()), job_id))

def zip_folder(folder: Path, output: Path):
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in folder.rglob('*'):
            if p.is_file() and p != output:
                z.write(p, p.relative_to(folder))
    return output

def process_job(job_id, operation, input_path, title):
    folder = JOBS / job_id
    try:
        update_job(job_id, 'processing', 'Media engine started.')
        output = folder / 'result'
        output.mkdir(exist_ok=True)
        if operation == 'scenes':
            run(['scenedetect', '-i', str(input_path), 'detect-content', 'list-scenes', '-o', str(output)])
            result = zip_folder(output, folder / 'scenes-report.zip')
        elif operation == 'auto_edit':
            result = output / 'auto-edited.mp4'
            run(['auto-editor', str(input_path), '--output', str(result)])
        elif operation == 'transcribe':
            cmd = ['whisperx', str(input_path), '--output_dir', str(output), '--output_format', 'all',
                   '--model', os.getenv('WHISPER_MODEL', 'small'), '--device', os.getenv('WHISPER_DEVICE', 'cpu'),
                   '--compute_type', os.getenv('WHISPER_COMPUTE_TYPE', 'int8')]
            if os.getenv('HF_TOKEN'):
                cmd += ['--hf_token', os.environ['HF_TOKEN'], '--diarize']
            run(cmd)
            result = zip_folder(output, folder / 'transcription.zip')
        elif operation == 'convert':
            result = output / 'converted.mp4'
            run(['ffmpeg', '-y', '-i', str(input_path), '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart', str(result)])
        elif operation == 'remotion':
            result = output / 'remotion-render.mp4'
            cmd = ['node', '/srv/remotion/render.mjs', str(input_path), str(result), (title or 'Hollywood Jailbreak Studio')[:80]]
            run(cmd, cwd='/srv/remotion')
        else:
            raise RuntimeError('Unsupported operation')
        if not result.exists() or result.stat().st_size == 0:
            raise RuntimeError('The processor completed without producing an output file.')
        update_job(job_id, 'completed', 'Processing completed successfully.', result)
    except subprocess.TimeoutExpired:
        update_job(job_id, 'failed', f'Processing exceeded the {TIMEOUT}-second job limit.')
    except Exception as exc:
        update_job(job_id, 'failed', str(exc))

@app.get('/health')
def health():
    return {'ok': True, 'service': 'hollywood-media', 'tools': ['ffmpeg','pyscenedetect','auto-editor','whisperx','remotion']}

@app.post('/v1/jobs')
async def create_job(request: Request, file: UploadFile = File(...), operation: str = Form(...), title: str = Form(''), authorization: str | None = Header(default=None), x_hj_user: str | None = Header(default=None)):
    auth(authorization)
    if not x_hj_user or len(x_hj_user) > 128:
        raise HTTPException(400, 'Missing authenticated user context')
    if operation not in {'scenes','auto_edit','transcribe','convert','remotion'}:
        raise HTTPException(422, 'Unknown processing operation')
    filename = Path(file.filename or 'upload.bin').name
    ext = Path(filename).suffix.lower()
    allowed = {'.mp4','.mov','.mkv','.webm','.avi','.m4v','.mp3','.wav','.m4a','.aac','.flac','.ogg'}
    if ext not in allowed:
        raise HTTPException(415, 'Unsupported file type')
    job_id = uuid.uuid4().hex
    folder = JOBS / job_id
    folder.mkdir(parents=True, exist_ok=False)
    input_path = folder / ('source' + ext)
    size = 0
    try:
        with input_path.open('wb') as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise HTTPException(413, f'Upload exceeds server limit of {MAX_BYTES // (1024*1024)} MB')
                out.write(chunk)
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise
    if not size:
        shutil.rmtree(folder, ignore_errors=True)
        raise HTTPException(422, 'Uploaded file is empty')
    now = int(time.time())
    with connect() as c:
        active = c.execute("SELECT COUNT(*) AS n FROM jobs WHERE user_id=? AND status IN ('queued','processing')", (x_hj_user,)).fetchone()['n']
        if active >= 1:
            shutil.rmtree(folder, ignore_errors=True)
            raise HTTPException(429, 'You already have a media job running. Wait for it to finish before starting another.')
        c.execute('INSERT INTO jobs(id,user_id,operation,status,message,workdir,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
                  (job_id, x_hj_user, operation, 'queued', 'Waiting for media worker.', str(folder), now, now))
    Thread(target=process_job, args=(job_id, operation, input_path, title), daemon=True).start()
    return {'ok': True, 'id': job_id, 'status': 'queued', 'message': f'{operation} job queued.'}

@app.get('/v1/jobs/{job_id}')
def get_job(job_id: str, authorization: str | None = Header(default=None), x_hj_user: str | None = Header(default=None)):
    auth(authorization)
    with connect() as c:
        row = c.execute('SELECT id,user_id,operation,status,message,output_path,created_at,updated_at FROM jobs WHERE id=?', (job_id,)).fetchone()
    if not row or row['user_id'] != x_hj_user:
        raise HTTPException(404, 'Job not found')
    return {'id': row['id'], 'operation': row['operation'], 'status': row['status'], 'message': row['message'], 'created_at': row['created_at'], 'updated_at': row['updated_at'], 'has_output': bool(row['output_path'])}

@app.get('/v1/jobs/{job_id}/output')
def get_output(job_id: str, authorization: str | None = Header(default=None), x_hj_user: str | None = Header(default=None)):
    auth(authorization)
    with connect() as c:
        row = c.execute('SELECT user_id,status,output_path FROM jobs WHERE id=?', (job_id,)).fetchone()
    if not row or row['user_id'] != x_hj_user or row['status'] != 'completed' or not row['output_path']:
        raise HTTPException(404, 'Output not found')
    path = Path(row['output_path']).resolve()
    if not path.is_file() or JOBS.resolve() not in path.parents:
        raise HTTPException(404, 'Output not found')
    return FileResponse(path, filename=path.name, media_type='application/octet-stream')
