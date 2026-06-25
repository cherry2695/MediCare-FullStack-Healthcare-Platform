// Type definitions for Web Speech API - SpeechRecognition
interface SpeechRecognitionErrorEvent extends Event {
  error: 'aborted' | 'audio-capture' | 'bad-grammar' | 'language-not-supported' | 'network' | 'no-speech' | 'not-allowed' | 'service-not-allowed';
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;

  onstart: (ev: Event) => any;
  onresult: (ev: SpeechRecognitionEvent) => any;
  onerror: (ev: SpeechRecognitionErrorEvent) => any;
  onend: (ev: Event) => any;
  onnomatch: (ev: SpeechRecognitionEvent) => any;
  onaudiostart: (ev: Event) => any;
  onaudioend: (ev: Event) => any;
  onsoundstart: (ev: Event) => any;
  onsoundend: (ev: Event) => any;
  onspeechstart: (ev: Event) => any;
  onspeechend: (ev: Event) => any;

  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

// Constructor interfaces
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

interface SpeechGrammarListConstructor {
  new (): SpeechGrammarList;
  prototype: SpeechGrammarList;
}

// Add global interfaces to Window
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechGrammarList: SpeechGrammarListConstructor;
    webkitSpeechGrammarList: SpeechGrammarListConstructor;
  }
}