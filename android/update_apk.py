import os
import sys
import zipfile
import hashlib
import base64
import subprocess
import tempfile
import time

def build_offline_html():
    return """<!doctype html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Awaaz AI Studio • آواز اے آئی</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background-color: #050507;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 16px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 18px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed, #db2777);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
    }
    .brand-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #ffffff;
    }
    .brand-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
    }
    .status-pill {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #6ee7b7;
      font-weight: 600;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .connecting-box {
      text-align: center;
      padding: 24px 16px;
      background: linear-gradient(180deg, rgba(79,70,229,0.12), rgba(124,58,237,0.04));
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 22px;
      margin-bottom: 18px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 14px auto;
      border: 3.5px solid rgba(255,255,255,0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      border: none;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(79,70,229,0.35);
      transition: all 0.2s;
    }
    .btn-primary:active { transform: scale(0.98); opacity: 0.9; }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 18px;
      background: rgba(255,255,255,0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
    }
    textarea {
      width: 100%;
      min-height: 110px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 14px;
      color: #fff;
      font-size: 15px;
      line-height: 1.7;
      resize: vertical;
      margin-bottom: 12px;
      direction: rtl;
    }
    textarea:focus { outline: none; border-color: #6366f1; }
    .slider-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .slider-row input[type="range"] {
      flex: 1;
      accent-color: #6366f1;
    }
    .lang-row {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .lang-btn {
      flex: 1;
      padding: 8px 4px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.7);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    .lang-btn.active {
      background: rgba(99,102,241,0.25);
      border-color: #6366f1;
      color: #fff;
    }
    .footer-note {
      margin-top: auto;
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      padding-top: 20px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="logo-badge">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
      </div>
      <div>
        <div class="brand-title">Awaaz AI Studio</div>
        <div class="brand-sub">آواز اے آئی اسٹوڈیو</div>
      </div>
    </div>
    <div class="status-pill" id="live-status">Standalone App</div>
  </div>

  <!-- Auto-Connect Cloud Box -->
  <div class="connecting-box" id="connect-banner">
    <div class="spinner" id="spinner-circle"></div>
    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;" id="status-heading">
      آن لائن AI اسٹوڈیو لوڈ ہو رہا ہے...
    </h3>
    <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 14px;" id="status-desc">
      تمام ریئلسٹک آوازوں اور ویڈیوز کے ساتھ کلاؤڈ اسٹوڈیو سے جڑا جا رہا ہے۔
    </p>

    <button type="button" class="btn-primary" onclick="launchCloudStudio()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" x2="21" y1="14" y2="3"/>
      </svg>
      <span>مکمل آن لائن اسٹوڈیو کھولیں</span>
    </button>
  </div>

  <!-- Offline Built-in Voice Engine -->
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h4 style="font-size: 14px; font-weight: 700;">مقامی آف لائن ٹیکسٹ ٹو اسپیچ (TTS Engine)</h4>
      <span style="font-size: 10px; color: #a5b4fc; background: rgba(99,102,241,0.15); padding: 2px 8px; border-radius: 6px;">Android Native</span>
    </div>

    <div class="lang-row">
      <button type="button" class="lang-btn active" id="btn-ur" onclick="setLang('ur-PK')">اردو (Urdu)</button>
      <button type="button" class="lang-btn" id="btn-hi" onclick="setLang('hi-IN')">हिंदी (Hindi)</button>
      <button type="button" class="lang-btn" id="btn-en" onclick="setLang('en-US')">English</button>
    </div>

    <textarea id="tts-input" placeholder="یہاں اردو یا انگلش متن لکھیں...">ستاروں سے آگے جہاں اور بھی ہیں
ابھی عشق کے امتحاں اور بھی ہیں</textarea>

    <div class="slider-row">
      <span style="color: rgba(255,255,255,0.6);">آواز کی رفتار:</span>
      <input type="range" id="tts-rate" min="0.5" max="1.5" step="0.1" value="1.0">
      <span id="rate-val" style="width: 32px; font-family: monospace;">1.0x</span>
    </div>

    <button type="button" class="btn-primary" onclick="speakText()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
      <span>آواز سنیں (Play Speech)</span>
    </button>
  </div>

  <div class="footer-note">
    Awaaz AI Studio v2.0 • Powered by Google AI Studio
  </div>

  <script>
    var currentLang = 'ur-PK';
    var rateInput = document.getElementById('tts-rate');
    var rateVal = document.getElementById('rate-val');

    rateInput.addEventListener('input', function() {
      rateVal.innerText = rateInput.value + 'x';
    });

    function setLang(lang) {
      currentLang = lang;
      document.querySelectorAll('.lang-btn').forEach(function(b) { b.classList.remove('active'); });
      if (lang === 'ur-PK') {
        document.getElementById('btn-ur').classList.add('active');
        document.getElementById('tts-input').dir = 'rtl';
      } else if (lang === 'hi-IN') {
        document.getElementById('btn-hi').classList.add('active');
        document.getElementById('tts-input').dir = 'ltr';
      } else {
        document.getElementById('btn-en').classList.add('active');
        document.getElementById('tts-input').dir = 'ltr';
      }
    }

    function speakText() {
      var text = document.getElementById('tts-input').value.trim();
      if (!text) return;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang;
        utterance.rate = parseFloat(rateInput.value) || 1.0;
        window.speechSynthesis.speak(utterance);
      } else {
        alert('Speech Synthesis not supported in this WebView.');
      }
    }

    // Target cloud URL to auto-connect
    var CLOUD_URL = 'https://ais-pre-5cvx4c33evmpc66n564nmm-904497767506.asia-east1.run.app';

    function launchCloudStudio() {
      window.location.href = CLOUD_URL;
    }

    // Auto-attempt connection if online
    if (navigator.onLine) {
      setTimeout(function() {
        // Attempt redirect if online
        try {
          var img = new Image();
          img.onload = function() {
            window.location.replace(CLOUD_URL);
          };
          img.onerror = function() {
            document.getElementById('status-heading').innerText = 'کلاؤڈ اسٹوڈیو کنکشن تیار ہے';
            document.getElementById('spinner-circle').style.display = 'none';
          };
          img.src = CLOUD_URL + '/icon.svg?t=' + Date.now();
        } catch(e) {}
      }, 1200);
    } else {
      document.getElementById('status-heading').innerText = 'انٹرنیٹ بند ہے (Offline Mode)';
      document.getElementById('status-desc').innerText = 'آپ بغیر انٹرنیٹ کے بھی نیچے دیا گیا ٹیکسٹ ٹو اسپیچ انجن استعمال کر سکتے ہیں۔';
      document.getElementById('spinner-circle').style.display = 'none';
    }
  </script>
</body>
</html>"""

def main():
    print("Building updated assets and APK package...")
    apk_src = "public/app-debug.apk"
    if not os.path.exists(apk_src):
        apk_src = "APK_DOWNLOAD/app-debug.apk"
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # 1. Unzip existing APK
        with zipfile.ZipFile(apk_src, 'r') as zin:
            zin.extractall(tmpdir)
        
        # 2. Update assets with the real compiled AI Studio web app
        dist_dir = "dist"
        assets_dest = os.path.join(tmpdir, "assets")
        os.makedirs(assets_dest, exist_ok=True)
        if os.path.exists(dist_dir):
            import shutil
            for item in os.listdir(dist_dir):
                s = os.path.join(dist_dir, item)
                d = os.path.join(assets_dest, item)
                if item.endswith('.apk') or item.endswith('.zip') or item.startswith('server.cjs'):
                    continue
                if os.path.isdir(s):
                    if os.path.exists(d):
                        shutil.rmtree(d)
                    shutil.copytree(s, d)
                else:
                    shutil.copy2(s, d)
        
        # Remove old signature files
        meta_inf = os.path.join(tmpdir, "META-INF")
        if os.path.exists(meta_inf):
            for fname in os.listdir(meta_inf):
                os.remove(os.path.join(meta_inf, fname))
        else:
            os.makedirs(meta_inf, exist_ok=True)
            
        # 3. Generate new debug key & self-signed cert
        key_file = os.path.join(tmpdir, "key.pem")
        cert_file = os.path.join(tmpdir, "cert.pem")
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
            '-keyout', key_file, '-out', cert_file,
            '-days', '10000', '-nodes',
            '-subj', '/CN=Awaaz AI Studio/O=Awaaz Studio/C=US'
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 4. Create MANIFEST.MF
        manifest_lines = [
            "Manifest-Version: 1.0",
            "Created-By: 1.0 (Android)",
            ""
        ]
        
        file_hashes = {}
        # Collect all files except META-INF
        all_files = []
        for root, dirs, files in os.walk(tmpdir):
            for file in files:
                rel = os.path.relpath(os.path.join(root, file), tmpdir).replace('\\', '/')
                if rel.startswith("META-INF/") or rel in ("key.pem", "cert.pem"):
                    continue
                all_files.append(rel)
                
        all_files.sort()
        for rel in all_files:
            filepath = os.path.join(tmpdir, rel)
            with open(filepath, 'rb') as fp:
                data = fp.read()
            h256 = base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')
            manifest_lines.append(f"Name: {rel}")
            manifest_lines.append(f"SHA-256-Digest: {h256}")
            manifest_lines.append("")
            file_hashes[rel] = h256
            
        manifest_content = "\r\n".join(manifest_lines) + "\r\n"
        manifest_path = os.path.join(meta_inf, "MANIFEST.MF")
        with open(manifest_path, 'w', encoding='utf-8') as f:
            f.write(manifest_content)
            
        # 5. Create CERT.SF
        manifest_hash = base64.b64encode(hashlib.sha256(manifest_content.encode('utf-8')).digest()).decode('ascii')
        sf_lines = [
            "Signature-Version: 1.0",
            "Created-By: 1.0 (Android)",
            f"SHA-256-Digest-Manifest: {manifest_hash}",
            ""
        ]
        for rel in all_files:
            # Hash of the 3 manifest lines for this entry
            entry_manifest = f"Name: {rel}\r\nSHA-256-Digest: {file_hashes[rel]}\r\n\r\n"
            entry_hash = base64.b64encode(hashlib.sha256(entry_manifest.encode('utf-8')).digest()).decode('ascii')
            sf_lines.append(f"Name: {rel}")
            sf_lines.append(f"SHA-256-Digest: {entry_hash}")
            sf_lines.append("")
            
        sf_content = "\r\n".join(sf_lines) + "\r\n"
        sf_path = os.path.join(meta_inf, "CERT.SF")
        with open(sf_path, 'w', encoding='utf-8') as f:
            f.write(sf_content)
            
        # 6. Sign CERT.SF to create CERT.RSA
        rsa_path = os.path.join(meta_inf, "CERT.RSA")
        subprocess.run([
            'openssl', 'cms', '-sign',
            '-in', sf_path,
            '-out', rsa_path,
            '-outform', 'DER',
            '-signer', cert_file,
            '-inkey', key_file,
            '-nodetach', '-nosmimecap', '-noattr'
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 7. Package everything into new APK
        out_apk = "public/app-debug.apk"
        with zipfile.ZipFile(out_apk, 'w', zipfile.ZIP_DEFLATED) as zout:
            # Put META-INF files first as per jar specs
            for meta_file in ["MANIFEST.MF", "CERT.SF", "CERT.RSA"]:
                meta_p = os.path.join(meta_inf, meta_file)
                zout.write(meta_p, f"META-INF/{meta_file}")
                
            for rel in all_files:
                filepath = os.path.join(tmpdir, rel)
                # Store resources.arsc uncompressed for faster Android loading
                compression = zipfile.ZIP_STORED if rel == "resources.arsc" else zipfile.ZIP_DEFLATED
                zout.write(filepath, rel, compress_type=compression)
                
        # Copy to APK_DOWNLOAD
        subprocess.run(['cp', '-f', out_apk, 'APK_DOWNLOAD/app-debug.apk'], check=True)
        size_bytes = os.path.getsize(out_apk)
        print(f"Updated and signed APK successfully: {size_bytes} bytes ({size_bytes / 1048576:.2f} MB)")

if __name__ == '__main__':
    main()
