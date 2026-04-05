import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  CreditCard as CardIcon, 
  Eye, 
  EyeOff, 
  Fingerprint,
  AlertCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isBiometricSupported, registerBiometric, authenticateBiometric } from './lib/auth';
import { CreditCard, getCardType, formatCardNumber, cardColors } from './types';

export default function App() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCvv, setShowCvv] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newCard, setNewCard] = useState<Omit<CreditCard, 'id'>>({
    holderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardType: 'other',
    color: cardColors[0],
  });

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isBiometricSupported();
      setIsSupported(supported);
      const registered = !!localStorage.getItem('biometric_credential_id');
      setIsRegistered(registered);
      
      // Load cards from local storage
      const savedCards = localStorage.getItem('secure_cards');
      if (savedCards) {
        try {
          setCards(JSON.parse(savedCards));
        } catch (e) {
          console.error("Failed to parse cards", e);
        }
      }
    };
    checkSupport();
  }, []);

  const handleUnlock = async () => {
    if (!isRegistered) {
      const success = await registerBiometric();
      if (success) {
        setIsRegistered(true);
        setIsUnlocked(true);
      } else {
        setError("Failed to register biometrics. Please try again.");
      }
    } else {
      const success = await authenticateBiometric();
      if (success) {
        setIsUnlocked(true);
        setError(null);
      } else {
        setError("Authentication failed.");
      }
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setShowCvv({});
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const card: CreditCard = {
      ...newCard,
      id: crypto.randomUUID(),
      cardType: getCardType(newCard.cardNumber),
    };
    const updatedCards = [...cards, card];
    setCards(updatedCards);
    localStorage.setItem('secure_cards', JSON.stringify(updatedCards));
    setShowAddForm(false);
    setNewCard({
      holderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardType: 'other',
      color: cardColors[Math.floor(Math.random() * cardColors.length)],
    });
  };

  const handleDeleteCard = (id: string) => {
    const updatedCards = cards.filter(c => c.id !== id);
    setCards(updatedCards);
    localStorage.setItem('secure_cards', JSON.stringify(updatedCards));
  };

  const toggleCvv = (id: string) => {
    setShowCvv(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isSupported === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold">Biometrics Not Supported</h1>
          <p className="text-slate-400">
            This application requires biometric hardware (TouchID, FaceID, etc.) and a secure context (HTTPS) to function.
          </p>
          <p className="text-xs text-slate-500">
            Note: If you are in a preview environment, biometric APIs might be restricted by the browser's security policy for iframes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SecureVault</h1>
        </div>
        
        {isUnlocked && (
          <button 
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Lock className="w-4 h-4" />
            Lock Vault
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {!isUnlocked ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative w-32 h-32 bg-slate-900 rounded-full border-2 border-slate-800 flex items-center justify-center">
                <Fingerprint className="w-16 h-16 text-blue-500" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Vault is Locked</h2>
              <p className="text-slate-400 max-w-xs mx-auto">
                {isRegistered 
                  ? "Use your biometrics to access your stored cards." 
                  : "Set up biometric authentication to start securing your cards."}
              </p>
            </div>

            <button 
              onClick={handleUnlock}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-3"
            >
              {isRegistered ? <Unlock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isRegistered ? "Unlock with Biometrics" : "Setup Secure Vault"}
            </button>

            {error && (
              <p className="text-rose-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold">Your Cards</h2>
                <p className="text-slate-400">Securely stored on this device</p>
              </div>
              <button 
                onClick={() => setShowAddForm(true)}
                className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="py-20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 space-y-4">
                <CardIcon className="w-12 h-12 opacity-20" />
                <p>No cards added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {cards.map((card) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative h-56 rounded-3xl p-6 flex flex-col justify-between shadow-2xl overflow-hidden group ${card.color}`}
                    >
                      {/* Card Background Pattern */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Card Holder</p>
                          <p className="font-bold text-lg">{card.holderName}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-2 bg-black/20 hover:bg-rose-500/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="relative z-10">
                        <p className="text-2xl font-mono tracking-[0.2em] mb-4">
                          {card.cardNumber}
                        </p>
                        <div className="flex justify-between items-end">
                          <div className="flex gap-8">
                            <div>
                              <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Expires</p>
                              <p className="font-bold">{card.expiryDate}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">CVV</p>
                              <div className="flex items-center gap-2">
                                <p className="font-bold">{showCvv[card.id] ? card.cvv : '•••'}</p>
                                <button onClick={() => toggleCvv(card.id)} className="text-white/60 hover:text-white">
                                  {showCvv[card.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="uppercase font-black italic text-xl opacity-80">
                            {card.cardType}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add New Card</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCard} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Card Holder Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    value={newCard.holderName}
                    onChange={e => setNewCard({...newCard, holderName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Card Number</label>
                  <input 
                    required
                    type="text" 
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    value={newCard.cardNumber}
                    onChange={e => setNewCard({...newCard, cardNumber: formatCardNumber(e.target.value)})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Expiry Date</label>
                    <input 
                      required
                      type="text" 
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                      value={newCard.expiryDate}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                        setNewCard({...newCard, expiryDate: val});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">CVV</label>
                    <input 
                      required
                      type="password" 
                      placeholder="•••"
                      maxLength={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                      value={newCard.cvv}
                      onChange={e => setNewCard({...newCard, cvv: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Card Color</label>
                  <div className="flex gap-2">
                    {cardColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCard({...newCard, color})}
                        className={`w-8 h-8 rounded-full transition-transform ${color} ${newCard.color === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] mt-4"
                >
                  Save Card
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="max-w-4xl mx-auto p-6 text-center text-slate-600 text-xs">
        <p>Data is stored locally on your device. Clearing browser cache will delete all cards.</p>
        <p className="mt-1">SecureVault uses industry-standard WebAuthn for biometric protection.</p>
      </footer>
    </div>
  );
}
