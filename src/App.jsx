import React, { useState, useEffect } from 'react';
import { Phone, TrendingUp, BookOpen, Clock, Download, Upload, X, Edit2, RotateCcw, BarChart3, User, MapPin, Briefcase, Plus, Trash2, Check } from 'lucide-react';

const ColdCallApp = () => {
  const [currentNode, setCurrentNode] = useState('start');
  const [callActive, setCallActive] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [activeScript, setActiveScript] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfileImport, setShowProfileImport] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [profile, setProfile] = useState(null);
  const [callPath, setCallPath] = useState([]);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    picture: '',
    address: '',
    company: '',
    position: '',
    timezone: '',
    country: '',
    state: '',
    city: ''
  });

  const defaultScript = {
    name: "Discord Badge Script",
    nodes: {
      start: {
        id: "start",
        text: "Hello, am I speaking with [First & Last Name], working at [Company]?",
        responses: [
          { label: "No", nextId: "wrong_person", sentiment: "negative" },
          { label: "Yes", nextId: "greeting", sentiment: "positive" }
        ]
      },
      wrong_person: {
        id: "wrong_person",
        text: "Okay, sorry for the disturbance. Have a nice day.",
        responses: []
      },
      greeting: {
        id: "greeting",
        text: "Alright, perfect. How are you doing today, [First Name]?",
        responses: [
          { label: "Continue", nextId: "opportunity_intro", sentiment: "neutral" }
        ]
      },
      opportunity_intro: {
        id: "opportunity_intro",
        text: "I'm calling today because I have an opportunity for you. The revenue can range from $500 to $2,000 in a single week.",
        responses: [
          { label: "Not interested", nextId: "refusal_1", sentiment: "negative" },
          { label: "Interested", nextId: "offer_details", sentiment: "positive" }
        ]
      },
      refusal_1: {
        id: "refusal_1",
        text: "Are you sure? It's really easy work.",
        responses: [
          { label: "Still no", nextId: "end_polite", sentiment: "negative" },
          { label: "Okay, continue", nextId: "offer_details", sentiment: "positive" }
        ]
      },
      end_polite: {
        id: "end_polite",
        text: "Alright then, have a nice day.",
        responses: []
      },
      offer_details: {
        id: "offer_details",
        text: "Perfect! I'll send you the details. What's the best way to reach you?",
        responses: []
      }
    }
  };

  useEffect(() => {
    const savedScripts = JSON.parse(localStorage.getItem('coldCallScripts') || '[]');
    const savedHistory = JSON.parse(localStorage.getItem('callHistory') || '[]');
    const savedProfile = JSON.parse(localStorage.getItem('callProfile') || 'null');
    
    if (savedScripts.length === 0) {
      setScripts([defaultScript]);
      setActiveScript(defaultScript);
      localStorage.setItem('coldCallScripts', JSON.stringify([defaultScript]));
    } else {
      setScripts(savedScripts);
      setActiveScript(savedScripts[0]);
    }
    
    setCallHistory(savedHistory);
    if (savedProfile) {
      setProfile(savedProfile);
      setProfileForm(savedProfile);
    }

    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setShowAnalytics(true);
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetCall();
      }
      if (e.key === 'Escape') {
        setShowAnalytics(false);
        setShowScripts(false);
        setShowHistory(false);
        setShowProfileImport(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const replaceProfilePlaceholders = (text) => {
    if (!profile) return text;
    return text
      .replace(/\[First & Last Name\]/g, `${profile.firstName} ${profile.lastName}`)
      .replace(/\[First Name\]/g, profile.firstName)
      .replace(/\[Last Name\]/g, profile.lastName)
      .replace(/\[Company\]/g, profile.company)
      .replace(/\[Position\]/g, profile.position);
  };

  const startCall = () => {
    const newCall = {
      id: Date.now(),
      scriptName: activeScript.name,
      startTime: new Date().toISOString(),
      path: [],
      sentiments: [],
      profile: profile
    };
    setCurrentCall(newCall);
    setCallActive(true);
    setCurrentNode('start');
    setCallPath([]);
  };

  const handleResponse = (response) => {
    const updatedPath = [...callPath, {
      nodeId: currentNode,
      response: response.label,
      sentiment: response.sentiment || 'neutral',
      timestamp: new Date().toISOString()
    }];
    
    setCallPath(updatedPath);
    setCurrentCall({
      ...currentCall,
      path: updatedPath,
      sentiments: [...(currentCall.sentiments || []), response.sentiment || 'neutral']
    });

    if (response.nextId) {
      setCurrentNode(response.nextId);
    }
  };

  const endCall = (outcome) => {
    const endTime = new Date().toISOString();
    const duration = Math.floor((new Date(endTime) - new Date(currentCall.startTime)) / 1000);
    
    const positiveCount = currentCall.sentiments.filter(s => s === 'positive').length;
    const negativeCount = currentCall.sentiments.filter(s => s === 'negative').length;
    const neutralCount = currentCall.sentiments.filter(s => s === 'neutral').length;
    
    const completedCall = {
      ...currentCall,
      endTime,
      duration,
      outcome,
      notes: callNotes,
      stats: {
        totalResponses: currentCall.sentiments.length,
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount,
        sentimentScore: positiveCount - negativeCount,
        engagementRate: currentCall.sentiments.length > 0 ? ((positiveCount + neutralCount) / currentCall.sentiments.length * 100).toFixed(1) : 0
      }
    };

    const updatedHistory = [completedCall, ...callHistory];
    setCallHistory(updatedHistory);
    localStorage.setItem('callHistory', JSON.stringify(updatedHistory));

    setCallActive(false);
    setCurrentCall(null);
    setCurrentNode('start');
    setCallNotes('');
    setCallPath([]);
  };

  const resetCall = () => {
    setCurrentNode('start');
    setCallPath([]);
    if (currentCall) {
      setCurrentCall({
        ...currentCall,
        path: [],
        sentiments: []
      });
    }
  };

  const calculateAnalytics = () => {
    if (callHistory.length === 0) {
      return {
        totalCalls: 0,
        wonCalls: 0,
        lostCalls: 0,
        followUpCalls: 0,
        winRate: 0,
        avgDuration: 0,
        avgSentimentScore: 0,
        totalPositive: 0,
        totalNegative: 0,
        totalNeutral: 0,
        avgEngagement: 0,
        callsByScript: {},
        performanceByHour: {},
        sentimentTrend: [],
        conversionFunnel: {}
      };
    }

    const wonCalls = callHistory.filter(c => c.outcome === 'won').length;
    const lostCalls = callHistory.filter(c => c.outcome === 'lost').length;
    const followUpCalls = callHistory.filter(c => c.outcome === 'follow-up').length;
    
    const totalDuration = callHistory.reduce((sum, c) => sum + (c.duration || 0), 0);
    const totalSentiment = callHistory.reduce((sum, c) => sum + (c.stats?.sentimentScore || 0), 0);
    const totalPositive = callHistory.reduce((sum, c) => sum + (c.stats?.positive || 0), 0);
    const totalNegative = callHistory.reduce((sum, c) => sum + (c.stats?.negative || 0), 0);
    const totalNeutral = callHistory.reduce((sum, c) => sum + (c.stats?.neutral || 0), 0);
    const totalEngagement = callHistory.reduce((sum, c) => sum + parseFloat(c.stats?.engagementRate || 0), 0);

    const callsByScript = {};
    const performanceByHour = {};
    const conversionFunnel = {};
    
    callHistory.forEach(call => {
      if (!callsByScript[call.scriptName]) {
        callsByScript[call.scriptName] = {
          total: 0,
          won: 0,
          lost: 0,
          followUp: 0,
          avgSentiment: 0,
          totalSentiment: 0,
          avgDuration: 0,
          totalDuration: 0,
          winRate: 0,
          positiveRate: 0,
          totalPositive: 0,
          totalResponses: 0
        };
      }
      const scriptData = callsByScript[call.scriptName];
      scriptData.total++;
      scriptData.totalSentiment += (call.stats?.sentimentScore || 0);
      scriptData.totalDuration += (call.duration || 0);
      scriptData.totalPositive += (call.stats?.positive || 0);
      scriptData.totalResponses += (call.stats?.totalResponses || 0);
      
      if (call.outcome === 'won') scriptData.won++;
      if (call.outcome === 'lost') scriptData.lost++;
      if (call.outcome === 'follow-up') scriptData.followUp++;

      scriptData.avgSentiment = (scriptData.totalSentiment / scriptData.total).toFixed(2);
      scriptData.avgDuration = Math.floor(scriptData.totalDuration / scriptData.total);
      scriptData.winRate = ((scriptData.won / scriptData.total) * 100).toFixed(1);
      scriptData.positiveRate = scriptData.totalResponses > 0 ? 
        ((scriptData.totalPositive / scriptData.totalResponses) * 100).toFixed(1) : 0;

      const hour = new Date(call.startTime).getHours();
      if (!performanceByHour[hour]) {
        performanceByHour[hour] = { total: 0, won: 0, avgSentiment: 0, totalSentiment: 0 };
      }
      performanceByHour[hour].total++;
      performanceByHour[hour].totalSentiment += (call.stats?.sentimentScore || 0);
      performanceByHour[hour].avgSentiment = (performanceByHour[hour].totalSentiment / performanceByHour[hour].total).toFixed(2);
      if (call.outcome === 'won') performanceByHour[hour].won++;

      call.path?.forEach(step => {
        const key = `${step.nodeId}_${step.response}`;
        if (!conversionFunnel[key]) {
          conversionFunnel[key] = { count: 0, won: 0, lost: 0, followUp: 0 };
        }
        conversionFunnel[key].count++;
        if (call.outcome === 'won') conversionFunnel[key].won++;
        if (call.outcome === 'lost') conversionFunnel[key].lost++;
        if (call.outcome === 'follow-up') conversionFunnel[key].followUp++;
      });
    });

    const sentimentTrend = callHistory.slice(0, 15).reverse().map(call => ({
      id: call.id,
      score: call.stats?.sentimentScore || 0,
      time: new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return {
      totalCalls: callHistory.length,
      wonCalls,
      lostCalls,
      followUpCalls,
      winRate: ((wonCalls / callHistory.length) * 100).toFixed(1),
      avgDuration: Math.floor(totalDuration / callHistory.length),
      avgSentimentScore: (totalSentiment / callHistory.length).toFixed(2),
      totalPositive,
      totalNegative,
      totalNeutral,
      avgEngagement: (totalEngagement / callHistory.length).toFixed(1),
      callsByScript,
      performanceByHour,
      sentimentTrend,
      conversionFunnel
    };
  };

  const exportData = (type) => {
    let data;
    let filename;

    if (type === 'analytics') {
      data = calculateAnalytics();
      filename = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      data = callHistory;
      filename = `call-history-${new Date().toISOString().split('T')[0]}.json`;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveProfile = () => {
    setProfile(profileForm);
    localStorage.setItem('callProfile', JSON.stringify(profileForm));
    setShowProfileImport(false);
  };

  const analytics = calculateAnalytics();
  const currentNodeData = activeScript?.nodes[currentNode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                Cold Call Manager
              </h1>
              <p className="text-gray-400">Professional call tracking & analytics</p>
            </div>
            {profile && (
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10">
                {profile.picture && (
                  <img src={profile.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
                )}
                <div>
                  <div className="font-semibold">{profile.firstName} {profile.lastName}</div>
                  <div className="text-sm text-gray-400">{profile.position} at {profile.company}</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowProfileImport(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={() => setShowScripts(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
            >
              <BookOpen size={18} />
              Scripts ({scripts.length})
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
            >
              <Clock size={18} />
              History ({callHistory.length})
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
            >
              <BarChart3 size={18} />
              Analytics
            </button>
            <button
              onClick={resetCall}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
            >
              <RotateCcw size={18} />
              Reset (Ctrl+R)
            </button>
          </div>
        </div>

        {/* Main Call Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Window */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{activeScript?.name || 'No Script'}</h2>
              {callActive && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-400">Live</span>
                </div>
              )}
            </div>

            {!callActive ? (
              <div className="text-center py-20">
                <Phone className="mx-auto mb-6 text-white/30" size={64} />
                <h3 className="text-2xl font-semibold mb-3">Ready to Start</h3>
                <p className="text-gray-400 mb-8">Begin your call with the selected script</p>
                <button
                  onClick={startCall}
                  disabled={!activeScript}
                  className="px-8 py-4 bg-gradient-to-r from-white to-gray-300 text-black rounded-xl font-semibold hover:scale-105 transition-all disabled:opacity-50"
                >
                  Start Call
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                  <div className="text-sm text-gray-400 mb-2">You say:</div>
                  <p className="text-lg leading-relaxed">
                    {replaceProfilePlaceholders(currentNodeData?.text || '')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-gray-400 mb-3">Response options:</div>
                  {currentNodeData?.responses?.map((response, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResponse(response)}
                      className="w-full text-left px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{response.label}</span>
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          response.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                          response.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {response.sentiment || 'neutral'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {currentNodeData?.responses?.length === 0 && (
                  <div className="space-y-3 pt-6 border-t border-white/10">
                    <div className="text-sm text-gray-400 mb-3">End call with outcome:</div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => endCall('won')}
                        className="flex-1 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl border border-green-500/30 transition-all"
                      >
                        Won
                      </button>
                      <button
                        onClick={() => endCall('lost')}
                        className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 transition-all"
                      >
                        Lost
                      </button>
                      <button
                        onClick={() => endCall('follow-up')}
                        className="flex-1 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl border border-yellow-500/30 transition-all"
                      >
                        Follow-Up
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Stats Sidebar */}
          <div className="space-y-6">
            {callActive && currentCall && (
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-4">Current Call</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400">Responses</div>
                    <div className="text-2xl font-bold">{currentCall.sentiments.length}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                      <div className="text-xs text-gray-400">Positive</div>
                      <div className="text-lg font-bold text-green-400">
                        {currentCall.sentiments.filter(s => s === 'positive').length}
                      </div>
                    </div>
                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      <div className="text-xs text-gray-400">Negative</div>
                      <div className="text-lg font-bold text-red-400">
                        {currentCall.sentiments.filter(s => s === 'negative').length}
                      </div>
                    </div>
                    <div className="bg-gray-500/10 p-3 rounded-lg border border-gray-500/20">
                      <div className="text-xs text-gray-400">Neutral</div>
                      <div className="text-lg font-bold text-gray-400">
                        {currentCall.sentiments.filter(s => s === 'neutral').length}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Call Notes</label>
                    <textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none resize-none"
                      rows="3"
                      placeholder="Add notes about this call..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Calls</span>
                  <span className="font-bold text-xl">{analytics.totalCalls}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="font-bold text-xl text-green-400">{analytics.winRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Duration</span>
                  <span className="font-bold text-xl">{Math.floor(analytics.avgDuration / 60)}:{(analytics.avgDuration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Sentiment</span>
                  <span className={`font-bold text-xl ${analytics.avgSentimentScore > 0 ? 'text-green-400' : analytics.avgSentimentScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {analytics.avgSentimentScore > 0 ? '+' : ''}{analytics.avgSentimentScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Import Modal */}
        {showProfileImport && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-white/20 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Contact Profile</h2>
                <button onClick={() => setShowProfileImport(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-2">Profile Picture URL</label>
                  <input
                    type="text"
                    value={profileForm.picture}
                    onChange={(e) => setProfileForm({...profileForm, picture: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Company</label>
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Position</label>
                  <input
                    type="text"
                    value={profileForm.position}
                    onChange={(e) => setProfileForm({...profileForm, position: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-2">Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Country</label>
                  <input
                    type="text"
                    value={profileForm.country}
                    onChange={(e) => setProfileForm({...profileForm, country: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Timezone</label>
                  <input
                    type="text"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({...profileForm, timezone: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:border-white/30 focus:outline-none"
                    placeholder="e.g., EST, PST, UTC+1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveProfile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-white to-gray-300 text-black rounded-xl font-semibold hover:scale-105 transition-all"
                >
                  Save Profile
                </button>
                <button
                  onClick={() => setShowProfileImport(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scripts Modal */}
        {showScripts && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Script Library</h2>
                <button onClick={() => setShowScripts(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {scripts.map((script, idx) => (
                  <div key={idx} className={`p-6 rounded-xl border-2 transition-all ${
                    activeScript?.name === script.name 
                      ? 'bg-white/10 border-white/30' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{script.name}</h3>
                        <p className="text-sm text-gray-400">{Object.keys(script.nodes).length} nodes</p>
                      </div>
                      <div className="flex gap-2">
                        {activeScript?.name === script.name && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium flex items-center gap-1">
                            <Check size={16} /> Active
                          </span>
                        )}
                        <button
                          onClick={() => setActiveScript(script)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => deleteScript(script)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {analytics.callsByScript[script.name] && (
                      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/10">
                        <div>
                          <div className="text-xs text-gray-400">Total Calls</div>
                          <div className="text-lg font-bold">{analytics.callsByScript[script.name].total}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Win Rate</div>
                          <div className="text-lg font-bold text-green-400">{analytics.callsByScript[script.name].winRate}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Avg Sentiment</div>
                          <div className={`text-lg font-bold ${
                            analytics.callsByScript[script.name].avgSentiment > 0 ? 'text-green-400' : 
                            analytics.callsByScript[script.name].avgSentiment < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {analytics.callsByScript[script.name].avgSentiment > 0 ? '+' : ''}{analytics.callsByScript[script.name].avgSentiment}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Positive Rate</div>
                          <div className="text-lg font-bold text-green-400">{analytics.callsByScript[script.name].positiveRate}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const newScript = {
                    name: `New Script ${scripts.length + 1}`,
                    nodes: {
                      start: {
                        id: "start",
                        text: "Hello, this is your opening line.",
                        responses: [
                          { label: "Response 1", nextId: "end", sentiment: "positive" }
                        ]
                      },
                      end: {
                        id: "end",
                        text: "Thank you for your time.",
                        responses: []
                      }
                    }
                  };
                  const updatedScripts = [...scripts, newScript];
                  setScripts(updatedScripts);
                  localStorage.setItem('coldCallScripts', JSON.stringify(updatedScripts));
                }}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-white to-gray-300 text-black rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create New Script
              </button>
            </div>
          </div>
        )}

        {/* Call History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Call History</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportData('history')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
                  >
                    <Download size={18} />
                    Export
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {callHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Clock size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No call history yet</p>
                  </div>
                ) : (
                  callHistory.map((call) => (
                    <div key={call.id} className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{call.scriptName}</h3>
                          <p className="text-sm text-gray-400">
                            {new Date(call.startTime).toLocaleString()}
                          </p>
                          {call.profile && (
                            <p className="text-sm text-gray-400 mt-1">
                              {call.profile.firstName} {call.profile.lastName} - {call.profile.company}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            call.outcome === 'won' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            call.outcome === 'lost' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {call.outcome?.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-white/10 rounded-lg text-sm font-medium border border-white/10">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3 mb-4">
                        <div className="bg-black/30 p-3 rounded-lg">
                          <div className="text-xs text-gray-400">Responses</div>
                          <div className="text-lg font-bold">{call.stats?.totalResponses || 0}</div>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          <div className="text-xs text-gray-400">Positive</div>
                          <div className="text-lg font-bold text-green-400">{call.stats?.positive || 0}</div>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                          <div className="text-xs text-gray-400">Negative</div>
                          <div className="text-lg font-bold text-red-400">{call.stats?.negative || 0}</div>
                        </div>
                        <div className="bg-gray-500/10 p-3 rounded-lg border border-gray-500/20">
                          <div className="text-xs text-gray-400">Neutral</div>
                          <div className="text-lg font-bold text-gray-400">{call.stats?.neutral || 0}</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-lg">
                          <div className="text-xs text-gray-400">Sentiment</div>
                          <div className={`text-lg font-bold ${
                            (call.stats?.sentimentScore || 0) > 0 ? 'text-green-400' :
                            (call.stats?.sentimentScore || 0) < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {(call.stats?.sentimentScore || 0) > 0 ? '+' : ''}{call.stats?.sentimentScore || 0}
                          </div>
                        </div>
                      </div>

                      {call.notes && (
                        <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">Notes</div>
                          <p className="text-sm">{call.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Detailed Analytics</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportData('analytics')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
                  >
                    <Download size={18} />
                    Export
                  </button>
                  <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                    <X size={24} />
                  </button>
                </div>
              </div>

              {analytics.totalCalls === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No analytics data yet. Start making calls to see insights.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Total Calls</div>
                      <div className="text-3xl font-bold">{analytics.totalCalls}</div>
                    </div>
                    <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/20">
                      <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                      <div className="text-3xl font-bold text-green-400">{analytics.winRate}%</div>
                      <div className="text-xs text-gray-400 mt-1">{analytics.wonCalls} won</div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Avg Duration</div>
                      <div className="text-3xl font-bold">
                        {Math.floor(analytics.avgDuration / 60)}:{(analytics.avgDuration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Avg Sentiment</div>
                      <div className={`text-3xl font-bold ${
                        analytics.avgSentimentScore > 0 ? 'text-green-400' :
                        analytics.avgSentimentScore < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {analytics.avgSentimentScore > 0 ? '+' : ''}{analytics.avgSentimentScore}
                      </div>
                    </div>
                  </div>

                  {/* Outcomes Breakdown */}
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4">Outcomes Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400 mb-1">{analytics.wonCalls}</div>
                        <div className="text-sm text-gray-400">Won Calls</div>
                        <div className="text-xs text-green-400 mt-1">{analytics.winRate}%</div>
                      </div>
                      <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400 mb-1">{analytics.lostCalls}</div>
                        <div className="text-sm text-gray-400">Lost Calls</div>
                        <div className="text-xs text-red-400 mt-1">
                          {((analytics.lostCalls / analytics.totalCalls) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">{analytics.followUpCalls}</div>
                        <div className="text-sm text-gray-400">Follow-Ups</div>
                        <div className="text-xs text-yellow-400 mt-1">
                          {((analytics.followUpCalls / analytics.totalCalls) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Analysis */}
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4">Sentiment Analysis</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Total Positive</div>
                        <div className="text-2xl font-bold text-green-400">{analytics.totalPositive}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Total Negative</div>
                        <div className="text-2xl font-bold text-red-400">{analytics.totalNegative}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Total Neutral</div>
                        <div className="text-2xl font-bold text-gray-400">{analytics.totalNeutral}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Avg Engagement</div>
                        <div className="text-2xl font-bold">{analytics.avgEngagement}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Trend Chart */}
                  {analytics.sentimentTrend.length > 0 && (
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                      <h3 className="text-xl font-bold mb-4">Recent Sentiment Trend</h3>
                      <div className="flex items-end gap-2 h-40">
                        {analytics.sentimentTrend.map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex-1 w-full flex items-end">
                              <div
                                className={`w-full rounded-t transition-all ${
                                  item.score > 0 ? 'bg-green-500/50' :
                                  item.score < 0 ? 'bg-red-500/50' : 'bg-gray-500/50'
                                }`}
                                style={{ height: `${Math.max(20, Math.abs(item.score) * 20)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-400">{item.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Script Performance */}
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4">Performance by Script</h3>
                    <div className="space-y-4">
                      {Object.entries(analytics.callsByScript).map(([scriptName, data]) => (
                        <div key={scriptName} className="bg-black/30 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-lg">{scriptName}</h4>
                            <span className="text-sm text-gray-400">{data.total} calls</span>
                          </div>
                          <div className="grid grid-cols-5 gap-3">
                            <div>
                              <div className="text-xs text-gray-400">Win Rate</div>
                              <div className="text-lg font-bold text-green-400">{data.winRate}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Avg Sentiment</div>
                              <div className={`text-lg font-bold ${
                                data.avgSentiment > 0 ? 'text-green-400' :
                                data.avgSentiment < 0 ? 'text-red-400' : 'text-gray-400'
                              }`}>
                                {data.avgSentiment > 0 ? '+' : ''}{data.avgSentiment}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Avg Duration</div>
                              <div className="text-lg font-bold">
                                {Math.floor(data.avgDuration / 60)}:{(data.avgDuration % 60).toString().padStart(2, '0')}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Positive Rate</div>
                              <div className="text-lg font-bold text-green-400">{data.positiveRate}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Outcomes</div>
                              <div className="text-sm">
                                <span className="text-green-400">{data.won}W</span> / 
                                <span className="text-red-400 ml-1">{data.lost}L</span> / 
                                <span className="text-yellow-400 ml-1">{data.followUp}F</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance by Hour */}
                  {Object.keys(analytics.performanceByHour).length > 0 && (
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                      <h3 className="text-xl font-bold mb-4">Performance by Hour</h3>
                      <div className="grid grid-cols-6 gap-3">
                        {Object.entries(analytics.performanceByHour)
                          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                          .map(([hour, data]) => (
                            <div key={hour} className="bg-black/30 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold mb-1">{hour}:00</div>
                              <div className="text-xs text-gray-400 mb-2">{data.total} calls</div>
                              <div className="text-sm font-bold text-green-400">
                                {data.total > 0 ? ((data.won / data.total) * 100).toFixed(0) : 0}% win
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Sentiment: {data.avgSentiment}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdCallApp;