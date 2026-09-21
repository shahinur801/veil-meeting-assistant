# Veil

Undetectable AI meeting assistant. Live notes, instant answers, never on the guest list.

Veil listens on your side of the call, transcribes in real time, and helps in the moment:

- **What should I say?**
- Follow-up questions
- Recap
- Structured meeting notes
- Free-form questions about the conversation

Assist is live out of the box. Optionally paste a [Google Gemini API key](https://aistudio.google.com/apikey) in Settings to route answers through your own Google account.

## Use it

1. Open the app and start a **demo call**, or **listen with your microphone** (Chrome / Edge).
2. Press **Assist** or `Cmd/Ctrl + Enter`.
3. End the session to save notes on this device.

Microphone transcription uses the browser speech engine. Screen-share remains undetectable because Veil never joins as a meeting bot.

## Stack

TanStack Start, React 19, Tailwind CSS. Notes stay in `localStorage`. Assist calls a server function that uses your Gemini key when present, otherwise the live model.

## Repo

[github.com/shahinur801/veil-meeting-assistant](https://github.com/shahinur801/veil-meeting-assistant)
