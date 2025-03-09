import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, AlertCircle } from 'lucide-react';
import { VoiceInput } from './VoiceInput';

interface Symptom {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
}

interface AnalysisResponse {
  extracted_symptoms: string;
  diagnosis: string | null;
}

export const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // For the Gemini API key - in a production app, this should be handled more securely
  const [apiKey, setApiKey] = useState('AIzaSyBBugr5_EJvAsWknredcLTbTYGhupmr7x8');

  const commonSymptoms: Symptom[] = [
    { id: '1', name: 'Headache', severity: 'medium' },
    { id: '2', name: 'Fever', severity: 'high' },
    { id: '3', name: 'Cough', severity: 'low' },
    { id: '4', name: 'Fatigue', severity: 'medium' },
  ];

  const handleAnalyze = async () => {
    // Check if there's text to analyze
    if (!symptoms && selectedSymptoms.length === 0) {
      setError('Please describe your symptoms or select some from the common symptoms list');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Prepare the text to send - combine manual input and selected symptoms
      const symptomsText = [
        symptoms,
        ...selectedSymptoms.map(s => s.name)
      ].filter(Boolean).join(', ');
      
      // Make the API call to the FastAPI backend
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: symptomsText,
          api_key: apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error from server: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze symptoms');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSymptom = (symptom: Symptom) => {
    if (!selectedSymptoms.find(s => s.id === symptom.id)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h2>
      </div>
      
      {/* API Key Input - typically this would be handled differently in production */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gemini API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      {selectedSymptoms.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Selected Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((symptom) => (
              <motion.span
                key={symptom.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1 rounded-full text-white ${
                  symptom.severity === 'high' 
                    ? 'bg-red-500' 
                    : symptom.severity === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              >
                {symptom.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
      
      <div className="relative space-y-4">
        <VoiceInput
          onTranscriptChange={setSymptoms}
          placeholder="Describe your symptoms in detail or click the microphone to speak..."
        />
        
        <motion.button
          className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
            isAnalyzing ? 'cursor-not-allowed' : ''
          }`}
          whileHover={!isAnalyzing ? { scale: 1.02 } : {}}
          whileTap={!isAnalyzing ? { scale: 0.98 } : {}}
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <motion.div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze Symptoms
            </>
          )}
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg"
        >
          <p>{error}</p>
        </motion.div>
      )}

      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Analysis Results</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Extracted Symptoms:</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md whitespace-pre-line">
              {analysisResult.extracted_symptoms}
            </div>
          </div>
          
          {analysisResult.diagnosis && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Diagnosis Analysis:</h4>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md whitespace-pre-line">
                {analysisResult.diagnosis}
              </div>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>⚠️ <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not replace professional medical advice.</p>
          </div>
        </motion.div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Common Symptoms</h3>
        <div className="flex flex-wrap gap-2">
          {commonSymptoms.map((symptom) => (
            <motion.button
              key={symptom.id}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addSymptom(symptom)}
            >
              <Plus className="w-4 h-4" />
              {symptom.name}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};