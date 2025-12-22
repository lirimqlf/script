import React, { useState, useEffect } from 'react';
import { Phone, BookOpen, Clock, X, RotateCcw, BarChart3, User, Upload, Download, TrendingUp, TrendingDown, Activity, Menu, Search } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const ColdCallApp = () => {
  const [currentNode, setCurrentNode] = useState('start');
  const [callActive, setCallActive] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [scripts, setScripts] = useState<any[]>([]);
  const [activeScript, setActiveScript] = useState<any>(null);
  const [activeView, setActiveView] = useState('call');
  const [callNotes, setCallNotes] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [callPath, setCallPath] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    position: '',
    phoneNumber: '',
    city: '',
    state: '',
    timezone: ''
  });

  const defaultScript = {
    name: "Default Script",
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
        text: "I'm calling today because I have an opportunity for you.",
        responses: [
          { label: "Not interested", nextId: "end_polite", sentiment: "negative" },
          { label: "Interested", nextId: "offer_details", sentiment: "positive" }
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
    if (scripts.length === 0) {
      setScripts([defaultScript]);
      setActiveScript(defaultScript);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getLocalTime = (city: string, state: string) => {
    if (!city || !state) return null;

    const timezones: Record<string, string[]> = {
      'ET': ['New York', 'Boston', 'Miami', 'Atlanta', 'Philadelphia'],
      'CT': ['Chicago', 'Houston', 'Dallas', 'Austin', 'San Antonio'],
      'MT': ['Denver', 'Phoenix', 'Salt Lake City', 'Albuquerque'],
      'PT': ['Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'San Diego']
    };

    let offset = -5;
    for (const [zone, cities] of Object.entries(timezones)) {
      if (cities.some(c => city.toLowerCase().includes(c.toLowerCase()))) {
        if (zone === 'ET') offset = -5;
        if (zone === 'CT') offset = -6;
        if (zone === 'MT') offset = -7;
        if (zone === 'PT') offset = -8;
        break;
      }
    }

    const utc = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
    const localTime = new Date(utc + (3600000 * offset));

    return localTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const replaceProfilePlaceholders = (text: string) => {
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
      sentiments: [],
      profile: profile
    };
    setCurrentCall(newCall);
    setCallActive(true);
    setCurrentNode('start');
    setCallPath([]);
  };

  const handleResponse = (response: any) => {
    const updatedPath = [...callPath, {
      nodeId: currentNode,
      response: response.label,
      sentiment: response.sentiment || 'neutral'
    }];

    setCallPath(updatedPath);
    setCurrentCall({
      ...currentCall,
      sentiments: [...(currentCall.sentiments || []), response.sentiment || 'neutral']
    });

    if (response.nextId) {
      setCurrentNode(response.nextId);
    }
  };

  const endCall = (outcome: string) => {
    const endTime = new Date().toISOString();
    const duration = Math.floor((new Date(endTime).getTime() - new Date(currentCall.startTime).getTime()) / 1000);

    const positiveCount = currentCall.sentiments.filter((s: string) => s === 'positive').length;
    const negativeCount = currentCall.sentiments.filter((s: string) => s === 'negative').length;

    const completedCall = {
      ...currentCall,
      endTime,
      duration,
      outcome,
      notes: callNotes,
      stats: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: currentCall.sentiments.filter((s: string) => s === 'neutral').length,
        sentimentScore: positiveCount - negativeCount
      }
    };

    setCallHistory([completedCall, ...callHistory] as any);
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
        sentiments: []
      });
    }
  };

  const saveProfile = () => {
    setProfile(profileForm);
    setShowProfileModal(false);
  };

  const importScript = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const importedScript = JSON.parse(event.target.result);
            setScripts([...scripts, importedScript]);
            setActiveScript(importedScript);
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const exportScript = (script: any) => {
    const dataStr = JSON.stringify(script, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteScript = (scriptToDelete: any) => {
    const updated = scripts.filter(s => s.name !== scriptToDelete.name);
    setScripts(updated);
    if (activeScript?.name === scriptToDelete.name && updated.length > 0) {
      setActiveScript(updated[0]);
    }
  };

  const currentNodeData = activeScript?.nodes[currentNode];

  const wonCalls = callHistory.filter((c: any) => c.outcome === 'won').length;
  const lostCalls = callHistory.filter((c: any) => c.outcome === 'lost').length;
  const followUpCalls = callHistory.filter((c: any) => c.outcome === 'follow-up').length;
  const totalCalls = callHistory.length;
  const winRate = totalCalls > 0 ? ((wonCalls / totalCalls) * 100).toFixed(1) : 0;
  const avgDuration = totalCalls > 0
    ? Math.floor(callHistory.reduce((sum: number, c: any) => sum + (c.duration || 0), 0) / totalCalls)
    : 0;

  const outcomeData = [
    { name: 'Won', value: wonCalls, color: '#000000' },
    { name: 'Lost', value: lostCalls, color: '#666666' },
    { name: 'Follow-up', value: followUpCalls, color: '#CCCCCC' }
  ];

  const sentimentData = callHistory.map((call: any) => ({
    name: new Date(call.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    positive: call.stats?.positive || 0,
    negative: call.stats?.negative || 0,
    neutral: call.stats?.neutral || 0
  })).slice(-7);

  const performanceData = callHistory.map((call: any, idx: number) => ({
    call: `Call ${idx + 1}`,
    duration: Math.floor(call.duration / 60),
    sentiment: call.stats?.sentimentScore || 0
  })).slice(-10);

  const localTime = profile ? getLocalTime(profile.city, profile.state) : null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className={`bg-neutral-950 border-r border-neutral-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Phone size={20} className="text-black" />
            </div>
            {sidebarOpen && <span className="font-bold text-lg">SaaS</span>}
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveView('call')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                activeView === 'call' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Phone size={20} />
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveView('scripts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                activeView === 'scripts' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <BookOpen size={20} />
              {sidebarOpen && <span className="font-medium">Scripts</span>}
              {sidebarOpen && <span className="ml-auto bg-neutral-800 text-xs px-2 py-1 rounded-full">{scripts.length}</span>}
            </button>

            <button
              onClick={() => setActiveView('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                activeView === 'history' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Clock size={20} />
              {sidebarOpen && <span className="font-medium">History</span>}
            </button>

            <button
              onClick={() => setActiveView('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                activeView === 'analytics' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <BarChart3 size={20} />
              {sidebarOpen && <span className="font-medium">Analytics</span>}
            </button>

            <div className="pt-6 mt-6 border-t border-neutral-800">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all duration-200"
              >
                <User size={20} />
                {sidebarOpen && <span className="font-medium">Profile</span>}
              </button>

              <button
                onClick={resetCall}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all duration-200"
              >
                <RotateCcw size={20} />
                {sidebarOpen && <span className="font-medium">Reset</span>}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-neutral-950 border-b border-neutral-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-neutral-900 rounded-full transition-all">
                <Menu size={20} />
              </button>
              <h1 className="text-2xl font-bold">
                {activeView === 'call' && 'Dashboard'}
                {activeView === 'scripts' && 'Scripts'}
                {activeView === 'history' && 'History'}
                {activeView === 'analytics' && 'Analytics'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900 rounded-full">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-bold">{getInitials(profile.firstName, profile.lastName)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{profile.firstName} {profile.lastName}</div>
                    <div className="text-xs text-neutral-400">{profile.company}</div>
                  </div>
                </div>
              )}
              {localTime && profile && (
                <div className="px-4 py-2 bg-neutral-900 rounded-full">
                  <div className="text-lg font-bold font-mono">{localTime}</div>
                  <div className="text-xs text-neutral-400">Local Time</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {activeView === 'call' && (
          <div className="bg-neutral-950 border-b border-neutral-800 p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-neutral-900 rounded-3xl p-6 hover:bg-neutral-800 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-400">Total Sales</span>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Activity size={20} className="text-black" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">{totalCalls}</div>
                <div className="text-xs text-neutral-400">All time calls</div>
              </div>

              <div className="bg-neutral-900 rounded-3xl p-6 hover:bg-neutral-800 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-400">Total Student</span>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <User size={20} className="text-black" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">{wonCalls}</div>
                <div className="text-xs text-neutral-400">Successful calls</div>
              </div>

              <div className="bg-neutral-900 rounded-3xl p-6 hover:bg-neutral-800 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-400">Total Chat</span>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Phone size={20} className="text-black" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">{winRate}%</div>
                <div className="text-xs text-neutral-400">Win rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeView === 'call' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all duration-300">
                  <div className="bg-neutral-900 border-b border-neutral-800 p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">{activeScript?.name || 'No Script'}</h2>
                      {callActive && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full">
                          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold">LIVE</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    {!callActive ? (
                      <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                          <Phone className="text-black" size={36} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Ready to Start</h3>
                        <p className="text-neutral-400 mb-8">Begin your call with the active script</p>
                        <button
                          onClick={startCall}
                          disabled={!activeScript}
                          className="px-12 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          START CALL
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-white text-black p-6 rounded-3xl">
                          <div className="text-xs font-bold uppercase tracking-wider mb-3 opacity-60">You Say:</div>
                          <p className="text-lg leading-relaxed font-medium">
                            {replaceProfilePlaceholders(currentNodeData?.text || '')}
                          </p>
                        </div>

                        {currentNodeData?.responses && currentNodeData.responses.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Response Options:</div>
                            {currentNodeData.responses.map((response: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleResponse(response)}
                                className="w-full text-left px-6 py-5 bg-neutral-900 border border-neutral-800 rounded-3xl hover:border-white hover:bg-neutral-800 transition-all group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-lg">{response.label}</span>
                                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                                    response.sentiment === 'positive' ? 'bg-white text-black' :
                                    response.sentiment === 'negative' ? 'bg-neutral-800 text-neutral-400' :
                                    'bg-neutral-800 text-neutral-400'
                                  }`}>
                                    {response.sentiment}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {currentNodeData?.responses && currentNodeData.responses.length === 0 && (
                          <div className="space-y-4 pt-6 border-t border-neutral-800">
                            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">End Call:</div>
                            <div className="grid grid-cols-3 gap-4">
                              <button
                                onClick={() => endCall('won')}
                                className="px-6 py-5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all"
                              >
                                WON
                              </button>
                              <button
                                onClick={() => endCall('lost')}
                                className="px-6 py-5 bg-neutral-800 text-white font-bold rounded-full hover:bg-neutral-700 transition-all"
                              >
                                LOST
                              </button>
                              <button
                                onClick={() => endCall('follow-up')}
                                className="px-6 py-5 bg-neutral-700 text-white font-bold rounded-full hover:bg-neutral-600 transition-all"
                              >
                                FOLLOW-UP
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {callActive && currentCall && (
                  <div className="bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800">
                    <div className="bg-neutral-900 border-b border-neutral-800 p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live Stats</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-neutral-900 p-3 border border-neutral-800 rounded-2xl">
                          <div className="text-xs text-neutral-400 mb-1 font-bold">POS</div>
                          <div className="text-2xl font-bold">
                            {currentCall.sentiments.filter((s: string) => s === 'positive').length}
                          </div>
                        </div>
                        <div className="bg-neutral-900 p-3 border border-neutral-800 rounded-2xl">
                          <div className="text-xs text-neutral-400 mb-1 font-bold">NEG</div>
                          <div className="text-2xl font-bold">
                            {currentCall.sentiments.filter((s: string) => s === 'negative').length}
                          </div>
                        </div>
                        <div className="bg-neutral-900 p-3 border border-neutral-800 rounded-2xl">
                          <div className="text-xs text-neutral-400 mb-1 font-bold">NEU</div>
                          <div className="text-2xl font-bold">
                            {currentCall.sentiments.filter((s: string) => s === 'neutral').length}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Notes</label>
                        <textarea
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white text-sm text-white"
                          rows={3}
                          placeholder="Add notes..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800">
                  <div className="bg-neutral-900 border-b border-neutral-800 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Quick Stats</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
                      <span className="text-sm text-neutral-400 font-bold uppercase tracking-wider">Total</span>
                      <span className="font-bold text-3xl">{totalCalls}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
                      <span className="text-sm text-neutral-400 font-bold uppercase tracking-wider">Win Rate</span>
                      <span className="font-bold text-3xl">{winRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-400 font-bold uppercase tracking-wider">Avg Time</span>
                      <span className="font-bold text-3xl">{Math.floor(avgDuration / 60)}:{(avgDuration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'scripts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Script Library</h2>
                <button
                  onClick={importScript}
                  className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all flex items-center gap-2"
                >
                  <Upload size={18} />
                  IMPORT JSON
                </button>
              </div>

              <div className="grid gap-4">
                {scripts.map((script, idx) => (
                  <div key={idx} className={`bg-neutral-950 rounded-3xl p-6 transition-all border-2 ${
                    activeScript?.name === script.name ? 'border-white' : 'border-neutral-800 hover:border-neutral-700'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{script.name}</h3>
                        <p className="text-sm text-neutral-400">{Object.keys(script.nodes).length} nodes</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setActiveScript(script)}
                          className="px-5 py-2 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all text-sm"
                        >
                          SELECT
                        </button>
                        <button
                          onClick={() => exportScript(script)}
                          className="px-5 py-2 bg-neutral-900 border border-neutral-800 font-bold rounded-full hover:bg-neutral-800 transition-all text-sm"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => deleteScript(script)}
                          className="px-5 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold rounded-full hover:bg-neutral-800 transition-all text-sm"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Call History</h2>

              {callHistory.length === 0 ? (
                <div className="text-center py-20 text-neutral-400">
                  <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={36} className="text-neutral-600" />
                  </div>
                  <p className="text-lg font-medium">No call history yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {callHistory.map((call: any) => (
                    <div key={call.id} className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {call.profile && (
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-black text-sm font-bold">
                                {getInitials(call.profile.firstName, call.profile.lastName)}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-bold mb-1">{call.scriptName}</h3>
                            <p className="text-sm text-neutral-400">
                              {new Date(call.startTime).toLocaleString()}
                            </p>
                            {call.profile && (
                              <p className="text-sm text-neutral-400 mt-1">
                                {call.profile.firstName} {call.profile.lastName} - {call.profile.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <span className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full ${
                            call.outcome === 'won' ? 'bg-white text-black' :
                            call.outcome === 'lost' ? 'bg-neutral-800 text-neutral-400' :
                            'bg-neutral-700 text-white'
                          }`}>
                            {call.outcome}
                          </span>
                          <span className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-bold rounded-full">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {call.notes && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-4">
                          <div className="text-xs text-neutral-400 mb-2 font-bold uppercase tracking-wider">Notes</div>
                          <p className="text-sm text-neutral-300">{call.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

              <div className="grid grid-cols-4 gap-6">
                <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Calls</div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Phone size={20} className="text-black" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{totalCalls}</div>
                  <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                    <Activity size={12} />
                    All time
                  </div>
                </div>
                <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Won</div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <TrendingUp size={20} className="text-black" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{wonCalls}</div>
                  <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {totalCalls > 0 ? `${((wonCalls / totalCalls) * 100).toFixed(0)}% of total` : 'No data'}
                  </div>
                </div>
                <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Lost</div>
                    <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
                      <TrendingDown size={20} className="text-neutral-400" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{lostCalls}</div>
                  <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                    <TrendingDown size={12} />
                    {totalCalls > 0 ? `${((lostCalls / totalCalls) * 100).toFixed(0)}% of total` : 'No data'}
                  </div>
                </div>
                <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Win Rate</div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <BarChart3 size={20} className="text-black" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{winRate}%</div>
                  <div className="text-xs text-neutral-400 mt-2">
                    {wonCalls} won / {totalCalls} total
                  </div>
                </div>
              </div>

              {callHistory.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800">
                      <h3 className="text-lg font-bold mb-4">Call Outcomes</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={outcomeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {outcomeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800">
                      <h3 className="text-lg font-bold mb-4">Call Duration Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={performanceData}>
                          <defs>
                            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ffffff" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                          <XAxis dataKey="call" stroke="#737373" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#171717', 
                              border: '1px solid #404040',
                              borderRadius: '12px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="duration" 
                            stroke="#ffffff" 
                            fillOpacity={1} 
                            fill="url(#colorDuration)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800">
                      <h3 className="text-lg font-bold mb-4">Sentiment Analysis</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sentimentData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                          <XAxis dataKey="name" stroke="#737373" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#171717', 
                              border: '1px solid #404040',
                              borderRadius: '12px'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="positive" fill="#ffffff" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="negative" fill="#737373" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="neutral" fill="#404040" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-neutral-950 rounded-3xl p-6 border border-neutral-800">
                      <h3 className="text-lg font-bold mb-4">Sentiment Score Over Time</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                          <XAxis dataKey="call" stroke="#737373" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#171717', 
                              border: '1px solid #404040',
                              borderRadius: '12px'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="sentiment" 
                            stroke="#ffffff" 
                            strokeWidth={3}
                            dot={{ fill: '#ffffff', r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {callHistory.length === 0 && (
                <div className="bg-neutral-950 rounded-3xl p-12 border border-neutral-800 text-center">
                  <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={36} className="text-neutral-600" />
                  </div>
                  <p className="text-neutral-400 text-lg font-medium">No data available yet</p>
                  <p className="text-neutral-500 text-sm mt-2">Complete some calls to see analytics</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-neutral-950 rounded-3xl max-w-2xl w-full border border-neutral-800 animate-in zoom-in-95 duration-200">
            <div className="bg-neutral-900 border-b border-neutral-800 p-6 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-2xl font-bold">Contact Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-neutral-800 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Company</label>
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Position</label>
                  <input
                    type="text"
                    value={profileForm.position}
                    onChange={(e) => setProfileForm({...profileForm, position: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-white transition-all text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={saveProfile}
                  className="flex-1 px-6 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all"
                >
                  SAVE PROFILE
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-4 bg-neutral-900 border border-neutral-800 font-bold rounded-full hover:bg-neutral-800 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdCallApp;
