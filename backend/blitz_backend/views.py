import os
import hmac
import hashlib
import json
import subprocess
import threading
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View


def _run_deployment_script():
    """Runs deployment script in background and logs results."""
    deploy_script = "/home/decodexe/deploy.sh"
    log_file = "/home/decodexe/deploy_webhook.log"

    if not os.path.exists(deploy_script):
        # Fallback local script inside repo if deploy.sh is in project root
        repo_script = "/home/decodexe/decodexe/Blitz-CS-Lab/deploy.sh"
        if os.path.exists(repo_script):
            deploy_script = repo_script

    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*50}\nWebhook deployment triggered.\n")
            f.flush()
            result = subprocess.run(
                ["/bin/bash", deploy_script],
                stdout=f,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=600,
            )
            f.write(f"\nDeployment finished with exit code {result.returncode}.\n")
    except Exception as e:
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\nDeployment error: {str(e)}\n")
        except Exception:
            pass


@method_decorator(csrf_exempt, name='dispatch')
class GitHubDeployWebhookView(View):
    """
    Receives GitHub webhook events on push to main branch and triggers
    production re-deployment automatically.
    """

    def get(self, request, *args, **kwargs):
        return JsonResponse({
            'status': 'ok',
            'message': 'Blitz Cyber Lab GitHub Deployment Webhook endpoint is active.',
            'target_branch': 'main',
        })

    def post(self, request, *args, **kwargs):
        secret = os.getenv('GITHUB_WEBHOOK_SECRET', '').strip()
        query_secret = request.GET.get('secret', '').strip()

        # Secret validation if configured
        if secret:
            signature_header = request.headers.get('X-Hub-Signature-256', '')
            if signature_header:
                expected_sig = 'sha256=' + hmac.new(
                    secret.encode('utf-8'),
                    request.body,
                    hashlib.sha256
                ).hexdigest()
                if not hmac.compare_digest(signature_header, expected_sig):
                    return JsonResponse({'error': 'Invalid HMAC signature'}, status=403)
            elif query_secret and hmac.compare_digest(query_secret, secret):
                pass
            else:
                return JsonResponse({'error': 'Authentication required'}, status=401)

        event = request.headers.get('X-GitHub-Event', 'push')
        if event == 'ping':
            return JsonResponse({'status': 'pong', 'message': 'Webhook connected successfully.'})

        try:
            payload = json.loads(request.body.decode('utf-8')) if request.body else {}
        except Exception:
            payload = {}

        ref = payload.get('ref', '')
        # Only deploy on pushes to main branch
        if ref and ref != 'refs/heads/main':
            return JsonResponse({
                'status': 'ignored',
                'message': f"Commit pushed to branch '{ref}', only 'refs/heads/main' triggers deployment."
            })

        commit_id = payload.get('after', payload.get('head_commit', {}).get('id', 'latest'))
        commit_msg = payload.get('head_commit', {}).get('message', 'No message')

        # Trigger deployment asynchronously so GitHub request does not time out
        deploy_thread = threading.Thread(target=_run_deployment_script, daemon=True)
        deploy_thread.start()

        return JsonResponse({
            'success': True,
            'message': 'Deployment triggered successfully.',
            'branch': 'main',
            'commit': commit_id[:8] if isinstance(commit_id, str) else commit_id,
            'commit_message': commit_msg,
        })
