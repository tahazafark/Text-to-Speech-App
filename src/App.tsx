import { useState, useRef, useEffect } from 'react';
import { Globe2, Play, Pause, Download } from 'lucide-react';
import axios from 'axios';

function App() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('en-US');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const requestInProgress = useRef(false);
  const [clickCount, setClickCount] = useState(0);
  const [showWaitMessage, setShowWaitMessage] = useState(false);

  const languages = [
    { code: 'en-US', name: 'English (US)', voice: 'en-US-Neural2-A' },
    { code: 'es-ES', name: 'Spanish', voice: 'es-ES-Neural2-A' },
    { code: 'fr-FR', name: 'French', voice: 'fr-FR-Neural2-A' },
    { code: 'de-DE', name: 'German', voice: 'de-DE-Neural2-A' },
    { code: 'it-IT', name: 'Italian', voice: 'it-IT-Neural2-A' },
    { code: 'hi-IN', name: 'Hindi', voice: 'hi-IN-Standard-C' }
  ];

  const handleSpeak = async () => {
    setClickCount(prev => prev + 1);

    if (clickCount > 0) {
      setShowWaitMessage(true);
      setTimeout(() => setShowWaitMessage(false), 5000);
    }

    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (audioBlob && audioUrl && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (error) {
        console.error('Error playing cached audio:', error);
      }
    }

    if (requestInProgress.current) {
      console.log('Request already in progress, please wait...');
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsProcessing(true);
    requestInProgress.current = true;

    try {
      const selectedLang = languages.find(lang => lang.code === selectedVoice);
      
      console.log('Frontend: Sending request with:', {
        text: text.substring(0, 100) + '...',
        languageCode: selectedVoice,
        voiceName: selectedLang?.voice
      });

      const response = await axios.post('/api/synthesize', {
        text,
        languageCode: selectedVoice,
        voiceName: selectedLang?.voice
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const blob = new Blob([response.data], { type: 'audio/mp3' });
      setAudioBlob(blob);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playError) {
          console.error('Frontend: Error playing audio:', playError);
          setError('Click play once more to start audio');
        }
      }

    } catch (error) {
      console.error('Frontend: Error details:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        let errorMessage = 'Failed to generate speech.';
        
        if (typeof errorData === 'object' && errorData !== null) {
          errorMessage = errorData.details || errorData.error || error.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        setError(`Error: ${errorMessage}`);
      } else {
        setError('Failed to generate speech. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      requestInProgress.current = false;
    }
  };

  const handleDownload = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const selectedLang = languages.find(lang => lang.code === selectedVoice);
      
      const response = await axios.post('/api/synthesize', {
        text,
        languageCode: selectedVoice,
        voiceName: selectedLang?.voice
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const blob = new Blob([response.data], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech-${selectedVoice}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading speech:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to download speech. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  useEffect(() => {
    setClickCount(0);
    setShowWaitMessage(false);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [text, selectedVoice]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Convert Text to Speech
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Natural sounding text to speech in multiple languages with various voices.
            Create audio content quickly and efficiently.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Language
              </label>
              <div className="relative">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 border p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <Globe2 className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              dir={selectedVoice === 'ur-PK' ? 'rtl' : 'ltr'}
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleSpeak}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!text.trim() || isLoading}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {isLoading ? 'Generating...' : 'Play'}
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!text.trim() || isLoading}
            >
              <Download className="w-5 h-5 mr-2" />
              {isLoading ? 'Generating...' : 'Download MP3'}
            </button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-3">100+ Languages</h3>
            <p className="text-gray-600">
              Support for over 100 languages with natural-sounding voices.
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-3">800+ Voices</h3>
            <p className="text-gray-600">
              Choose from over 800 different voices to find the perfect match.
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-3">Instant Generation</h3>
            <p className="text-gray-600">
              Convert your text to speech in seconds with our advanced AI technology.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-4">
          {audioUrl && (
            <>
              <audio 
                ref={audioRef} 
                controls 
                className="w-full max-w-md"
                preload="auto"
              />
              {isProcessing && (
                <p className="text-blue-600">Loading audio, please wait...</p>
              )}
              {showWaitMessage && (
                <p className="text-yellow-600">
                  Please wait a moment, the audio will start playing shortly...
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          {audioUrl && (
            <audio 
              ref={audioRef} 
              controls 
              className="w-full max-w-md"
              preload="auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;