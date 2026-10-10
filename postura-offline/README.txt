Postura - offline version
=========================

Postura is a study posture tracker. It turns time spent studying into break
time. Your camera video is processed on your device and is never uploaded.

Keep these files together, exactly as they are:
  index.html, sw.js, manifest.webmanifest, icons/


HOW TO OPEN IT
--------------

Option A - Run it on your own computer (localhost, recommended)

  1. Unzip the folder.
  2. Open a terminal in the folder:
       Windows: open the folder, click the address bar, type "cmd", press Enter
       Mac:     right-click the folder -> "New Terminal at Folder"
       Linux:   right-click in the folder -> "Open in Terminal"
  3. Run:
       python3 -m http.server 8000
     (On Windows, if that doesn't work, try: python -m http.server 8000)
  4. Open your browser and go to:
       http://localhost:8000
  5. Allow camera access when asked.
  6. To stop it, go back to the terminal and press Ctrl + C.

  You need Python installed (python.org). It is free.

Option B - Open the file directly

  1. Unzip the folder.
  2. Open your browser (Chrome, Edge or Firefox).
  3. Press Ctrl + O (Cmd + O on Mac).
  4. Select index.html and click Open.

  Note: some browsers block the camera or offline saving when a file is
  opened this way. If the camera doesn't work, use Option A instead.


USING IT OFFLINE
----------------
1. Open Postura ONCE while connected to the internet.
2. Wait a few seconds for the face detector to finish loading.
3. After that, it can start without internet in that same browser.

Notes
-----
- Use the same browser and the same address each time (for example, always
  http://localhost:8000).
- Clearing the site's data in your browser removes the saved copy.
- The first visit needs internet because the face detector and fonts are
  downloaded from public CDNs and saved in your browser.