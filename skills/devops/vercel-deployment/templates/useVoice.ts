import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceOptions {
  onTranscript: (text: string) => void
  onSpeakingStart: () => void
  onSpeakingEnd: () => void
}

export function useVoice({ onTranscript, onSpeakingStart, onSpeakingEnd }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [useManualInput, setUseManualInput] = useState(false)
  const recognitionRef = useRef<any>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const isListeningRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const hasNativeSTT = typeof window !== 'undefined' && 
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  useEffect(() => {
    if (!hasNativeSTT) {
      setError('Safari detected. Using server-side STT or manual input.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      setError(null)
    }

    rec.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interim += t
        }
      }
      if (final) {
        setTranscript(final)
        onTranscript(final)
      } else {
        setTranscript(interim)
      }
    }

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') setError('Microphone permission denied')
      else if (e.error === 'no-speech') setError('No speech detected')
      else setError(`Speech error: ${e.error}`)
      isListeningRef.current = false
      setIsListening(false)
    }

    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start() } catch { isListeningRef.current = false; setIsListening(false) }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = rec
  }, [onTranscript, hasNativeSTT])

  const startServerSTT = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1]
          try {
            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64 }),
            })
            const data = await res.json()
            if (data.transcript) {
              setTranscript(data.transcript)
              onTranscript(data.transcript)
            }
          } catch {
            setError('STT failed. Try manual input.')
          }
          setIsListening(false)
        }
      }

      mediaRecorder.start()
      setIsListening(true)
      setError(null)

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          stream.getTracks().forEach(t => t.stop())
        }
      }, 5000)
    } catch {
      setError('Microphone access denied.')
      setIsListening(false)
    }
  }, [onTranscript])

  const startListening = useCallback(() => {
    setTranscript('')
    setError(null)
    if (hasNativeSTT) {
      isListeningRef.current = true
      try { recognitionRef.current?.start() } catch {}
    } else {
      startServerSTT()
    }
  }, [hasNativeSTT, startServerSTT])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    try { recognitionRef.current?.stop() } catch {}
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    }
    setIsListening(false)
  }, [])

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true)
    onSpeakingStart()

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: 'Q7IOSFX7VG3cnK4eU8Z4' }),
      })

      if (res.ok && res.headers.get('content-type')?.includes('audio')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        currentAudioRef.current = audio
        audio.onended = () => { setIsSpeaking(false); onSpeakingEnd(); URL.revokeObjectURL(url) }
        audio.onerror = () => { setIsSpeaking(false); onSpeakingEnd() }
        await audio.play()
        return
      }
      throw new Error('Server TTS unavailable')
    } catch {
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 1.1
      utter.pitch = 0.9
      utter.onstart = () => setIsSpeaking(true)
      utter.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utter)
    }
  }, [onSpeakingStart, onSpeakingEnd])

  const stopSpeaking = useCallback(() => {
    currentAudioRef.current?.pause()
    currentAudioRef.current = null
    speechSynthesis.cancel()
    setIsSpeaking(false)
    onSpeakingEnd()
  }, [onSpeakingEnd])

  return { 
    isListening, 
    isSpeaking, 
    transcript, 
    error,
    useManualInput,
    setUseManualInput,
    startListening, 
    stopListening, 
    speak, 
    stopSpeaking 
  }
}
