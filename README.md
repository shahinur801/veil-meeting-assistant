# Veil

Undetectable AI meeting assistant. Live notes, instant answers, never on the guest list.

Same job as a desktop meeting copilot: listen on your side of the call, transcribe, and help in the moment.

- **What should I say?**
- Follow-up questions
- Fact check
- Who am I talking to
- Recap
- Structured meeting notes
- Follow-up email
- Ask about the conversation or the screen

Assist is live in this preview. On your own Mac or VM, paste a [Google Gemini API key](https://aistudio.google.com/apikey) in Settings.

## Use it here

1. Open the app and start a **demo call**, or **listen with your microphone** (Chrome / Edge).
2. Press **Assist** or `Cmd/Ctrl + Enter`. Hide the overlay with `Cmd/Ctrl + \\`.
3. End the session to save notes on this device.

Never joins as a meeting bot. Share only the Zoom / Meet / Teams window, not Veil.

## Install on a local Mac

Needs macOS 10.15+, Chrome or Edge, Git, and Node 22.

```bash
brew install git node
git clone https://github.com/shahinur801/veil-meeting-assistant.git
cd veil-meeting-assistant
npm install
npm run dev
```

Open Chrome at `http://localhost:8080`. Allow the microphone. Add your Gemini key in Settings.

## Install in a virtual machine

Use UTM (free on Apple Silicon), Parallels, VMware Fusion, or VirtualBox.

1. Create a guest with 4 GB RAM, 2 CPUs, 20 GB disk (Ubuntu 22.04 or Windows 11).
2. Enable microphone passthrough in the VM settings.
3. Install Chrome in the guest.
4. Run the commands below, then open `http://localhost:8080` in guest Chrome.
5. Join the meeting from inside the VM. Share the meeting window only.

**Ubuntu guest**

```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
git clone https://github.com/shahinur801/veil-meeting-assistant.git
cd veil-meeting-assistant
npm install
npm run dev
```

**Windows guest (PowerShell)**

```powershell
winget install Git.Git OpenJS.NodeJS.LTS Google.Chrome
git clone https://github.com/shahinur801/veil-meeting-assistant.git
cd veil-meeting-assistant
npm install
npm run dev
```

## Stack

TanStack Start, React 19, Tailwind CSS. Notes stay in `localStorage`. Assist uses your Gemini key when present, otherwise the live model in this hosted preview.

## Repo

[github.com/shahinur801/veil-meeting-assistant](https://github.com/shahinur801/veil-meeting-assistant)
