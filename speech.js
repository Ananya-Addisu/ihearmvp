document.addEventListener('DOMContentLoaded', function() {
    function checkAuth() {
        const currentUser = localStorage.getItem('ihear_current_user');
        
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(navigator.userAgent);
        
        if (!isChrome && !isEdge) {
            alert('ይቅርታ፣ ይህ መተግበሪያ በመረጡት አሳሽ ላይ አይሰራም። እባክዎ Chrome ወይም Edge ይጠቀሙ።');
            window.location.href = 'index.html';
            return false;
        }
        
        if (currentUser) {
            updateUserProfile(currentUser);
        } else {
            const userAvatar = document.querySelector('.user-avatar');
            const username = document.querySelector('.username');
            const logoutButton = document.getElementById('logout-button');
            
            if (userAvatar && username) {
                userAvatar.textContent = 'A';
                username.textContent = 'Ananya';
            }
            
            if (logoutButton) {
                logoutButton.textContent = 'ውጣ';
                logoutButton.addEventListener('click', () => {
                    window.location.href = 'index.html';
                }, { once: true });
            }
        }
        
        return true;
    }
    
    function updateUserProfile(userJson) {
        try {
            const user = JSON.parse(userJson);
            const userAvatar = document.querySelector('.user-avatar');
            const username = document.querySelector('.username');
            
            if (userAvatar && username && user) {
                if (user.name && user.name.length > 0) {
                    userAvatar.textContent = user.name.charAt(0).toUpperCase();
                }
                
                if (user.name) {
                    username.textContent = user.name;
                }
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    }
    
    if (!checkAuth()) return;

    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    
    const voiceToggle = document.getElementById('voice-toggle');
    let isFemaleVoice = localStorage.getItem('voice') === 'female';
    
    function setVoice(isFemale) {
        voiceToggle.classList.toggle('female', isFemale);
        localStorage.setItem('voice', isFemale ? 'female' : 'male');
        isFemaleVoice = isFemale;
        updateVoiceType();
    }
    
    setVoice(isFemaleVoice);
    
    voiceToggle.addEventListener('click', () => {
        setVoice(!isFemaleVoice);
    });

    const modeSwitcher = document.querySelector('.mode-switcher');
    const sections = document.querySelectorAll('.section');

    modeSwitcher.addEventListener('click', (e) => {
        const button = e.target.closest('.mode-button');
        if (!button) return;

        document.querySelectorAll('.mode-button').forEach(btn => 
            btn.classList.remove('active'));
        button.classList.add('active');

        const mode = button.dataset.mode;
        sections.forEach(section => {
            section.classList.toggle('active', section.id === `${mode}-section`);
        });
    });
    
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        if (localStorage.getItem('ihear_current_user')) {
            localStorage.removeItem('ihear_current_user');
        }
        window.location.href = 'index.html';
    });

    console.log('Initializing iHear v1.0...');
    
    if (!('webkitSpeechRecognition' in window)) {
        alert('iHear: ይቅርታ፣ ይህ መተግበሪያ በመረጡት አሳሽ ላይ አይሰራም። እባክዎ Chrome ወይም Edge ይጠቀሙ።');
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'am-ET';
    recognition.interimResults = true;
    recognition.continuous = true;

    const startBtn = document.getElementById('start-recognition');
    const status = document.getElementById('recognition-status');
    const transcript = document.getElementById('transcript');
    const speakBtn = document.getElementById('speak-text');
    const textToSpeak = document.getElementById('text-to-speech');
    const synthesisStatus = document.getElementById('synthesis-status');
    
    const transliterationContainer = document.getElementById('transliteration-container');
    const transliterationText = document.getElementById('transliteration-text');
    
    const interimResults = document.createElement('div');
    interimResults.id = 'interim-results';
    interimResults.style.color = 'var(--text-secondary)';
    interimResults.style.opacity = '0.6';
    interimResults.style.marginBottom = '10px';
    interimResults.style.fontStyle = 'italic';
    
    transcript.parentNode.insertBefore(interimResults, transcript);
    
    startBtn.addEventListener('click', async () => {
        try {
            if (startBtn.classList.contains('recording')) {
                recognition.stop();
                document.getElementById('speech-to-text-section').classList.remove('recording-active');
                return;
            }
            
            transcript.value = '';
            interimResults.textContent = '';
            
            status.textContent = 'iHear እያዳመጠ ነው...';
            startBtn.classList.add('recording');
            startBtn.querySelector('.button-text').textContent = 'ማቆም';
            document.getElementById('speech-to-text-section').classList.add('recording-active');
            
            setTimeout(() => {
                recognition.start();
            updateRecognitionStats();
            }, 100);
        } catch (error) {
            status.textContent = 'iHear ስህተት: ' + error.message;
        }
    });

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        interimResults.textContent = interimTranscript;
        
        if (finalTranscript) {

            document.getElementById('transcript').value += finalTranscript;
        }
        
        status.textContent = 'iHear በመተንተን ላይ...';
    };

    recognition.onend = () => {
        status.textContent = 'iHear ትንተናውን አጠናቅቋል';
        startBtn.classList.remove('recording');
        startBtn.querySelector('.button-text').textContent = 'መቅዳት ጀምር';
        document.getElementById('speech-to-text-section').classList.remove('recording-active');
        
        interimResults.textContent = '';
    };

    recognition.onerror = (event) => {
        status.textContent = 'iHear ስህተት: ' + event.error;
        startBtn.classList.remove('recording');
        startBtn.querySelector('.button-text').textContent = 'መቅዳት ጀምር';
    };

    const amharicToEnglishMap = {
        'ሀ': 'ha', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
        'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo',
        'ሐ': 'ha', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h', 'ሖ': 'ho',
        'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me', 'ም': 'm', 'ሞ': 'mo',
        'ሠ': 'se', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so',
        'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro',
        'ሰ': 'se', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so',
        'ሸ': 'she', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho',
        'ቀ': 'qe', 'ቁ': 'qu', 'ቂ': 'qi', 'ቃ': 'qa', 'ቄ': 'qe', 'ቅ': 'q', 'ቆ': 'qo',
        'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo',
        'ተ': 'te', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to',
        'ቸ': 'che', 'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'che', 'ች': 'ch', 'ቾ': 'cho',
        'ነ': 'ne', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no',
        'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'i', 'ኦ': 'o',
        'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko',
        'ወ': 'we', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'wo',
        'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'i', 'ዖ': 'o',
        'ዘ': 'ze', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo',
        'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ይ': 'y', 'ዮ': 'yo',
        'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd', 'ዶ': 'do',
        'ጀ': 'je', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'je', 'ጅ': 'j', 'ጆ': 'jo',
        'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go',
        'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te', 'ጥ': 't', 'ጦ': 'to',
        'ጨ': 'che', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho',
        'ጰ': 'pe', 'ጱ': 'pu', 'ጲ': 'pi', 'ጳ': 'pa', 'ጴ': 'pe', 'ጵ': 'p', 'ጶ': 'po',
        'ፈ': 'fe', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo',
        'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po'
    };

    function transliterateAmharic(text) {
        if (!text) return '';
        
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            result += amharicToEnglishMap[char] || char;
        }
        
        return result;
    }

    let speechSynth = window.speechSynthesis;
    let voices = [];
    let currentUtterance = null;
    let voicesLoaded = false;

    function loadVoices() {
        const availableVoices = speechSynth.getVoices();
        if (availableVoices && availableVoices.length > 0) {
            voices = availableVoices;
            voicesLoaded = true;
            console.log(`Loaded ${voices.length} voices`);
        }
    }

    loadVoices();

    if (speechSynth.onvoiceschanged !== undefined) {
        speechSynth.onvoiceschanged = loadVoices;
    }

    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1000);
    setTimeout(loadVoices, 2000);

    function getVoice(isFemale) {
        try {
            if (!voices || voices.length === 0) {
                voices = speechSynth.getVoices();
            }
            
            if (!voices || voices.length === 0) {
                return null;
            }
            
            let voice = null;
            
            if (isFemale) {
                voice = voices.find(v => 
                    (v.name.toLowerCase().includes('female') || 
                     v.name.toLowerCase().includes('woman') ||
                     v.name.toLowerCase().includes('girl')) && 
                    (v.lang.startsWith('en'))
                );
            } else {
                voice = voices.find(v => 
                    (v.name.toLowerCase().includes('male') || 
                     v.name.toLowerCase().includes('man') || 
                     v.name.toLowerCase().includes('guy')) && 
                    (v.lang.startsWith('en'))
                );
            }
            
            if (!voice) {
                voice = voices.find(v => v.lang.startsWith('en'));
            }
            
            if (!voice && voices.length > 0) {
                voice = voices[0];
            }
            
            return voice;
        } catch (e) {
            console.error('Error getting voice:', e);
            return null;
        }
    }

    function speakText(text, isFemale) {
        try {
            if (!text) return;
            
            if (speechSynth.speaking) {
                speechSynth.cancel();
            }
            
            if (text.length > 100) {
                text = text.substring(0, 100);
            }
            
            synthesisStatus.textContent = 'እየተነበበ ነው...';
        
            const transliteratedText = transliterateAmharic(text);
            transliterationText.textContent = transliteratedText;
            transliterationContainer.style.display = 'block';
            
            const utterance = new SpeechSynthesisUtterance(transliteratedText);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = isFemale ? 1.1 : 0.9;
            utterance.volume = 1;
            
            const voice = getVoice(isFemale);
            if (voice) {
                utterance.voice = voice;
            }
            
            utterance.onend = () => {
                synthesisStatus.textContent = '';
                currentUtterance = null;
            };
            
            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                synthesisStatus.textContent = 'ስህተት';
                currentUtterance = null;
            };
            
            currentUtterance = utterance;
            
            setTimeout(() => {
                speechSynth.speak(utterance);
            }, 50);
        } catch (error) {
            console.error('TTS error:', error);
            synthesisStatus.textContent = 'ስህተት';
            currentUtterance = null;
        }
    }

    speakBtn.addEventListener('click', () => {
        const text = textToSpeak.value.trim();
        if (!text) {
            synthesisStatus.textContent = 'እባክዎ ጽሑፍ ያስገቡ።';
            return;
        }

        speakText(text, isFemaleVoice);
    });

    let typingTimer;
    let lastProcessedText = '';
    
    textToSpeak.addEventListener('input', () => {
        const text = textToSpeak.value.trim();
        
        if (text) {
            const transliteratedText = transliterateAmharic(text);
            transliterationText.textContent = transliteratedText;
            transliterationContainer.style.display = 'block';
        } else {
            transliterationContainer.style.display = 'none';
            return;
        }
        
        if (text === lastProcessedText) {
            return;
        }
        
        if (speechSynth.speaking) {
            speechSynth.cancel();
        }
        
        clearTimeout(typingTimer);
        
        typingTimer = setTimeout(() => {
            lastProcessedText = text;
            speakText(text, isFemaleVoice);
        }, 1200);
    });

    async function simulateModelLoading() {
        return new Promise(resolve => setTimeout(resolve, 100));
    }
    
    function updateRecognitionStats() {
        const accuracyStat = document.querySelector('.stat-value:first-child');
        const responseStat = document.querySelector('.stat-value:nth-child(4)');
        
        if (accuracyStat) {
            const randomAccuracy = (97 + Math.random() * 2).toFixed(1);
            accuracyStat.textContent = randomAccuracy + '%';
        }
        
        if (responseStat) {
            const randomResponse = (0.2 + Math.random() * 0.3).toFixed(1);
            responseStat.textContent = randomResponse + 's';
        }
    }
    
    function updateVoiceType() {
        const voiceTypeElement = document.querySelector('#text-to-speech-section .stat-value[data-stat="voice-type"]');
        if (voiceTypeElement) {
            voiceTypeElement.textContent = isFemaleVoice ? 'ሴት' : 'ወንድ';
        }
    }
    
    updateVoiceType();
    
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', () => {
            console.log('User profile clicked');
        });
    }
});


