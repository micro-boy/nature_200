import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Copy, Download, Shuffle, Sparkles, Camera, Mountain, TreePine, Sun, CloudRain, Bird, Leaf, Globe, Dice6, Settings, Zap, Info, HelpCircle, Lock, Unlock, Clock, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

const NaturePromptGenerator = () => {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessTimeLeft, setAccessTimeLeft] = useState(0);
  const [userName, setUserName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Admin states for code generation
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDuration, setNewCodeDuration] = useState(7);
  const [newCodeType, setNewCodeType] = useState('days');
  const [generatedCodes, setGeneratedCodes] = useState([]);

  // UI States
  const [selectedCategories, setSelectedCategories] = useState(['landscapes']);
  const [selectedStyles, setSelectedStyles] = useState(['authentic']);
  const [selectedSeasons, setSelectedSeasons] = useState(['spring']);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('4:5');
  const [promptCount, setPromptCount] = useState(50);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGuide, setShowGuide] = useState(false); // Minimized by default
  
  // Midjourney Settings - Manual & Persistent
  const [mjSettings, setMjSettings] = useState({
    version: '7.0',
    style: 'raw',
    quality: '2',
    chaos: '0',
    stylize: '100',
    weird: '0',
    tile: false,
    customParams: ''
  });

  const [showTooltip, setShowTooltip] = useState(null);

  // Predefined user access data dengan EXPIRY DATE ABSOLUT
  const userDatabase = {
    // Format: accessCode: { name, expiryDate (ISO string), type }
    'premium2025': { 
      name: 'Premium User', 
      expiryDate: '2025-07-15T23:59:59.000Z', // Expired tanggal 15 Juli 2025
      type: 'Premium'
    },
    'trial123': { 
      name: 'Trial User', 
      expiryDate: '2025-06-20T23:59:59.000Z', // Expired tanggal 20 Juni 2025
      type: 'Trial'
    },
    'demo789': { 
      name: 'Demo User', 
      expiryDate: '2025-06-12T23:59:59.000Z', // Expired besok untuk testing
      type: 'Demo'
    },
    'vip2025': { 
      name: 'VIP User', 
      expiryDate: '2025-12-31T23:59:59.000Z', // Expired akhir tahun 2025
      type: 'VIP'
    },
    'admin2025': {
      name: 'Administrator',
      expiryDate: '2026-12-31T23:59:59.000Z',
      type: 'Admin'
    }
  };

  // Generate unique access code dengan expiry date
  const generateAccessCode = (name, durationType, duration) => {
    const now = new Date();
    let expiryDate = new Date(now);
    
    switch(durationType) {
      case 'hours':
        expiryDate.setHours(expiryDate.getHours() + duration);
        break;
      case 'days':
        expiryDate.setDate(expiryDate.getDate() + duration);
        break;
      case 'weeks':
        expiryDate.setDate(expiryDate.getDate() + (duration * 7));
        break;
      case 'months':
        expiryDate.setMonth(expiryDate.getMonth() + duration);
        break;
      default:
        expiryDate.setDate(expiryDate.getDate() + duration);
    }

    // Generate random code dengan timestamp
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const code = `${timestamp}${random}`.toUpperCase();

    return {
      code,
      name: name || `User-${code}`,
      expiryDate: expiryDate.toISOString(),
      type: 'Generated',
      createdAt: now.toISOString()
    };
  };

  // Calculate time left berdasarkan expiry date
  const calculateTimeLeft = (expiryDateISO) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryDateISO).getTime();
    return Math.max(0, expiry - now);
  };

  // Check if code is expired
  const isCodeExpired = (expiryDateISO) => {
    return new Date() > new Date(expiryDateISO);
  };

  // Timer effect for countdown berdasarkan expiry date
  useEffect(() => {
    let timer;
    if (isAuthenticated && accessTimeLeft > 0) {
      timer = setInterval(() => {
        setAccessTimeLeft(prev => {
          if (prev <= 1000) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setLoginError('Session expired. Access code has reached its expiry date.');
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAuthenticated, accessTimeLeft]);

  // Authentication function dengan expiry date validation
  const handleLogin = () => {
    // Check admin access first
    if (loginPassword === 'admin2025') {
      const adminUser = userDatabase['admin2025'];
      if (isCodeExpired(adminUser.expiryDate)) {
        setLoginError('Admin access has expired. Please contact system administrator.');
        return;
      }
      
      setIsAuthenticated(true);
      setIsAdmin(true);
      setUserName(adminUser.name);
      setAccessTimeLeft(calculateTimeLeft(adminUser.expiryDate));
      setLoginError('');
      setLoginPassword('');
      return;
    }

    // Check regular user access
    const user = userDatabase[loginPassword];
    if (user) {
      // Check if code is expired
      if (isCodeExpired(user.expiryDate)) {
        setLoginError(`Access code expired on ${new Date(user.expiryDate).toLocaleDateString()}. Please contact admin for renewal.`);
        return;
      }

      setIsAuthenticated(true);
      setIsAdmin(false);
      setUserName(user.name);
      setAccessTimeLeft(calculateTimeLeft(user.expiryDate));
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid access code. Please contact admin for valid code.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setAccessTimeLeft(0);
    setUserName('');
    setLoginPassword('');
    setGeneratedPrompts([]);
    setShowAdminPanel(false);
  };

  // Admin function to generate new access codes
  const handleGenerateCode = () => {
    if (!newCodeName.trim()) {
      alert('Please enter a name for the new access code');
      return;
    }

    const newCode = generateAccessCode(newCodeName, newCodeType, newCodeDuration);
    setGeneratedCodes(prev => [...prev, newCode]);
    
    // Reset form
    setNewCodeName('');
    setNewCodeDuration(7);
    setNewCodeType('days');
  };

  // Copy code to clipboard
  const copyCodeToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert('Access code copied to clipboard!');
  };

  // Format time display
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (days > 7) return `${days} days remaining`;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Format expiry date for display
  const formatExpiryDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parameter explanations for beginners
  const parameterExplanations = {
    version: {
      title: "Version",
      description: "Versi model Midjourney yang digunakan. V7.0 adalah yang terbaru dengan kualitas terbaik dan fitur paling lengkap."
    },
    style: {
      title: "Style",
      description: "Gaya interpretasi AI. 'Raw' menghasilkan foto realistis, 'Scenic' untuk pemandangan dramatis, 'Expressive' untuk hasil artistik."
    },
    quality: {
      title: "Quality",
      description: "Kualitas rendering. 2 = kualitas tinggi (4x lebih detail), 1 = standar, 0.5 = cepat tapi kasar. Nilai tinggi = waktu render lebih lama."
    },
    chaos: {
      title: "Chaos",
      description: "Tingkat variasi hasil. 0 = konsisten, 100 = sangat bervariasi. Berguna untuk eksperimen kreatif atau mencari hasil yang unik."
    },
    stylize: {
      title: "Stylize",
      description: "Seberapa artistik hasilnya. 0 = sangat realistis, 1000 = sangat artistik. 100 adalah balance ideal untuk stock photography."
    },
    weird: {
      title: "Weird",
      description: "Tingkat keanehan/eksperimen. 0 = normal, 3000 = sangat eksperimental. Gunakan hati-hati untuk stock photography."
    },
    tile: {
      title: "Tile",
      description: "Membuat gambar seamless pattern yang bisa diulang tanpa terlihat sambungan. Berguna untuk texture atau background."
    },
    customParams: {
      title: "Custom Parameters",
      description: "Parameter tambahan seperti '--no people' (hapus orang), '--upbeta' (upscale beta), atau '--seed 123' (hasil konsisten)."
    }
  };

  // Data berdasarkan analisis tren Adobe Stock - NO LIVING CREATURES
  const categories = {
    landscapes: {
      icon: Mountain,
      subjects: [
        'arctic glacier formations', 'golden hour mountain peaks', 'misty forest valleys', 
        'dramatic coastal cliffs', 'rolling green hills', 'desert sand dunes',
        'crystal clear alpine lakes', 'volcanic landscapes', 'canyon formations',
        'meadow wildflowers', 'bamboo forests', 'waterfall cascades'
      ]
    },
    weather: {
      icon: CloudRain,
      subjects: [
        'aurora borealis dancing', 'storm clouds gathering', 'morning fog rolling',
        'rainbow after rain', 'lightning illuminating sky', 'snow falling gently',
        'sunbeams through clouds', 'mist over lake', 'dramatic storm front',
        'frost patterns on leaves', 'ice crystal formations', 'wind patterns in grass'
      ]
    },
    botanical: {
      icon: Leaf,
      subjects: [
        'cherry blossoms in bloom', 'autumn leaves falling', 'macro flower details',
        'moss covered rocks', 'fern fronds unfurling', 'succulent arrangements',
        'forest canopy patterns', 'desert cacti blooming', 'mushrooms in forest floor', 
        'tree bark textures', 'tropical palm leaves', 'wildflower meadows'
      ]
    },
    underwater: {
      icon: Globe,
      subjects: [
        'coral reef formations', 'underwater caves', 'kelp forest swaying',
        'sea anemones dancing', 'underwater sunbeams', 'bubbles rising',
        'colorful coral gardens', 'underwater rock formations', 'seaweed patterns',
        'ocean floor landscapes', 'underwater canyon', 'marine plant life'
      ]
    },
    aerial: {
      icon: Camera,
      subjects: [
        'drone view of coastline', 'aerial forest patterns', 'meandering rivers',
        'geometric farm fields', 'mountain range panorama', 'island archipelago',
        'city parks from above', 'winding mountain roads', 'lake reflections',
        'beach wave patterns', 'glacier formations', 'valley landscapes'
      ]
    },
    minerals: {
      icon: Sparkles,
      subjects: [
        'crystal cave formations', 'geode interior patterns', 'mineral deposits',
        'salt flat formations', 'rock crystal clusters', 'gemstone textures',
        'cave stalactites', 'marble vein patterns', 'quartz formations',
        'natural stone textures', 'crystal growth patterns', 'mineral layers'
      ]
    }
  };

  const styles = {
    authentic: ['natural lighting', 'unprocessed colors', 'documentary style', 'candid moments'],
    minimalist: ['clean composition', 'negative space', 'simple elements', 'zen aesthetic'],
    dramatic: ['high contrast', 'dramatic lighting', 'bold shadows', 'intense mood'],
    cinematic: ['film grain', 'color grading', 'wide aspect', 'movie-like quality'],
    ethereal: ['soft focus', 'dreamy atmosphere', 'golden light', 'magical mood'],
    scientific: ['macro detail', 'precise focus', 'educational value', 'documentary precision']
  };

  const seasons = {
    spring: ['fresh green growth', 'morning dew', 'blooming flowers', 'baby animals'],
    summer: ['lush vegetation', 'bright sunlight', 'clear skies', 'active wildlife'],
    autumn: ['falling leaves', 'warm colors', 'harvest time', 'golden light'],
    winter: ['snow covered', 'ice formations', 'bare branches', 'winter animals']
  };

  const aspectRatios = {
    '4:5': 'Instagram optimized',
    '16:9': 'Landscape/cinematic',
    '1:1': 'Square format',
    '3:2': 'Classic photography',
    '9:16': 'Vertical/mobile'
  };

  const qualityParams = [
    'shot with Sony A7R V', 'Canon EOS R5', 'Nikon Z9', 'professional photography',
    'award winning landscape photography', 'National Geographic style', 'nature documentary style',
    'ultra high resolution', '8K quality', 'sharp focus', 'perfect exposure',
    'professional nature photography', 'landscape photography masterpiece'
  ];

  const lightingConditions = [
    'golden hour lighting', 'blue hour atmosphere', 'soft morning light', 'dramatic sunset',
    'diffused natural light', 'backlighting', 'side lighting', 'overcast conditions',
    'magic hour glow', 'dappled forest light', 'rim lighting', 'volumetric lighting'
  ];

  // Randomize function untuk categories, styles, dan seasons
  const randomizeSelections = () => {
    const allCategories = Object.keys(categories);
    const allStyles = Object.keys(styles);
    const allSeasons = Object.keys(seasons);
    
    // Random 1-3 categories
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const randomCategories = [];
    for (let i = 0; i < numCategories; i++) {
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
      if (!randomCategories.includes(randomCategory)) {
        randomCategories.push(randomCategory);
      }
    }
    
    // Random 1-2 styles
    const numStyles = Math.floor(Math.random() * 2) + 1;
    const randomStyles = [];
    for (let i = 0; i < numStyles; i++) {
      const randomStyle = allStyles[Math.floor(Math.random() * allStyles.length)];
      if (!randomStyles.includes(randomStyle)) {
        randomStyles.push(randomStyle);
      }
    }
    
    // Random 1-2 seasons
    const numSeasons = Math.floor(Math.random() * 2) + 1;
    const randomSeasons = [];
    for (let i = 0; i < numSeasons; i++) {
      const randomSeason = allSeasons[Math.floor(Math.random() * allSeasons.length)];
      if (!randomSeasons.includes(randomSeason)) {
        randomSeasons.push(randomSeason);
      }
    }
    
    setSelectedCategories(randomCategories);
    setSelectedStyles(randomStyles);
    setSelectedSeasons(randomSeasons);
  };

  // Generate Midjourney parameters
  const generateMjParams = () => {
    let params = [];
    
    params.push(`--ar ${selectedAspectRatio}`);
    
    if (mjSettings.version) params.push(`--v ${mjSettings.version}`);
    if (mjSettings.style && mjSettings.style !== 'none') params.push(`--style ${mjSettings.style}`);
    if (mjSettings.quality && mjSettings.quality !== '1') params.push(`--q ${mjSettings.quality}`);
    if (mjSettings.chaos && mjSettings.chaos !== '0') params.push(`--chaos ${mjSettings.chaos}`);
    if (mjSettings.stylize && mjSettings.stylize !== '100') params.push(`--s ${mjSettings.stylize}`);
    if (mjSettings.weird && mjSettings.weird !== '0') params.push(`--weird ${mjSettings.weird}`);
    if (mjSettings.tile) params.push('--tile');
    if (mjSettings.customParams) params.push(mjSettings.customParams);
    
    return params.join(' ');
  };

  const generatePrompts = useCallback(() => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const prompts = [];
      
      for (let i = 0; i < promptCount; i++) {
        // Pilih kategori secara random dari yang dipilih
        const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
        const subject = categories[category].subjects[Math.floor(Math.random() * categories[category].subjects.length)];
        
        // Pilih style secara random
        const style = selectedStyles[Math.floor(Math.random() * selectedStyles.length)];
        const styleDesc = styles[style][Math.floor(Math.random() * styles[style].length)];
        
        // Pilih season secara random
        const season = selectedSeasons[Math.floor(Math.random() * selectedSeasons.length)];
        const seasonDesc = seasons[season][Math.floor(Math.random() * seasons[season].length)];
        
        // Pilih quality dan lighting
        const quality = qualityParams[Math.floor(Math.random() * qualityParams.length)];
        const lighting = lightingConditions[Math.floor(Math.random() * lightingConditions.length)];
        
        // Additional elements untuk variasi
        const additionalElements = [
          'hyper realistic', 'ultra detailed', 'professional composition', 'landscape documentary style',
          'conservation photography', 'environmental storytelling', 'natural landscape capture',
          'pristine wilderness', 'untouched nature', 'ecosystem showcase', 'climate documentation',
          'sustainable landscape', 'natural habitat photography', 'environmental awareness', 'earth photography'
        ];
        
        const additional = additionalElements[Math.floor(Math.random() * additionalElements.length)];
        
        // Buat prompt yang lengkap dengan custom Midjourney parameters
        const mjParams = generateMjParams();
        const prompt = `${subject}, ${styleDesc}, ${seasonDesc}, ${lighting}, ${quality}, ${additional} ${mjParams}`;
        
        prompts.push({
          id: i + 1,
          prompt: prompt,
          category: category,
          style: style,
          season: season
        });
      }
      
      setGeneratedPrompts(prompts);
      setIsGenerating(false);
    }, 1000);
  }, [selectedCategories, selectedStyles, selectedSeasons, selectedAspectRatio, promptCount]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllPrompts = () => {
    const allPrompts = generatedPrompts.map(p => `/imagine ${p.prompt}`).join('\n\n');
    copyToClipboard(allPrompts);
  };

  const exportPrompts = () => {
    const dataStr = JSON.stringify(generatedPrompts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nature_prompts_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleStyle = (style) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const toggleSeason = (season) => {
    setSelectedSeasons(prev => 
      prev.includes(season) 
        ? prev.filter(s => s !== season)
        : [...prev, season]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <TreePine className="text-green-600" size={40} />
            Adobe Stock Nature Photography Prompt Generator
            {isAuthenticated && <span className="text-green-500 text-lg">PRO</span>}
          </h1>
          <p className="text-lg text-gray-600">Generate 100+ nature photography prompts based on 2025 market trends</p>
        </div>

        {/* Authentication Check */}
        {!isAuthenticated ? (
          /* Login Screen */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
              <div className="text-center mb-6">
                <Lock className="mx-auto text-blue-600 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Premium Access Required</h2>
                <p className="text-gray-600">Enter your access code to continue</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Code
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Enter your access code"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{loginError}</p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={!loginPassword.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Unlock size={20} />
                  Access Premium Features
                </button>
              </div>

              {/* Demo access codes for testing */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Demo Access Codes (dengan Expiry Date):</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  {Object.entries(userDatabase).filter(([key]) => key !== 'admin2025').map(([code, data]) => (
                    <div key={code} className="flex justify-between items-center bg-white p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">{code}</span>
                        <span className="text-xs">{data.type}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-semibold ${isCodeExpired(data.expiryDate) ? 'text-red-600' : 'text-green-600'}`}>
                          {isCodeExpired(data.expiryDate) ? 'EXPIRED' : 'ACTIVE'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Until: {formatExpiryDate(data.expiryDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  💡 <strong>Admin Access:</strong> <span className="font-mono">admin2025</span> - Full access with code generator
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Application */
          <>
            {/* User Status Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-gray-800">Welcome, {userName}</span>
                  {isAdmin && <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">ADMIN</span>}
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock size={16} />
                  <span className="font-mono text-sm">Time left: {formatTime(accessTimeLeft)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Settings size={16} />
                    {showAdminPanel ? 'Hide' : 'Show'} Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <Lock size={16} />
                  Logout
                </button>
              </div>
            </div>

            {/* Admin Panel for Code Generation */}
            {isAdmin && showAdminPanel && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 mb-6 text-white">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Settings size={20} />
                  Admin Panel - Generate Access Codes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Code Generator */}
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Generate New Access Code</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">User Name</label>
                        <input
                          type="text"
                          value={newCodeName}
                          onChange={(e) => setNewCodeName(e.target.value)}
                          placeholder="Enter user name"
                          className="w-full p-2 rounded border border-white/20 bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Duration</label>
                          <input
                            type="number"
                            value={newCodeDuration}
                            onChange={(e) => setNewCodeDuration(parseInt(e.target.value))}
                            min="1"
                            className="w-full p-2 rounded border border-white/20 bg-white/10 text-white focus:bg-white/20 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            value={newCodeType}
                            onChange={(e) => setNewCodeType(e.target.value)}
                            className="w-full p-2 rounded border border-white/20 bg-white/10 text-white focus:bg-white/20 focus:outline-none"
                          >
                            <option value="hours" className="text-black">Hours</option>
                            <option value="days" className="text-black">Days</option>
                            <option value="weeks" className="text-black">Weeks</option>
                            <option value="months" className="text-black">Months</option>
                          </select>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleGenerateCode}
                        className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                      >
                        Generate Access Code
                      </button>
                    </div>
                  </div>

                  {/* Generated Codes List */}
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Generated Codes ({generatedCodes.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {generatedCodes.length === 0 ? (
                        <p className="text-white/60 text-sm">No codes generated yet</p>
                      ) : (
                        generatedCodes.map((codeData, index) => (
                          <div key={index} className="bg-white/10 rounded p-3 text-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold">{codeData.name}</div>
                                <div className="font-mono text-xs bg-white/20 inline-block px-2 py-1 rounded mt-1">
                                  {codeData.code}
                                </div>
                              </div>
                              <button
                                onClick={() => copyCodeToClipboard(codeData.code)}
                                className="bg-white/20 hover:bg-white/30 p-1 rounded transition-colors duration-200"
                                title="Copy code"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <div className="text-xs text-white/80">
                              Expires: {formatExpiryDate(codeData.expiryDate)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className="text-sm text-white/90">
                    💡 <strong>Tip:</strong> Generated codes are temporary and stored in browser session. 
                    For production, integrate with your database to persist codes permanently.
                  </p>
                </div>
              </div>
            )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Random Controls */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Dice6 size={20} />
                Quick Random
              </h3>
              <button
                onClick={randomizeSelections}
                className="w-full bg-white text-purple-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                Randomize Selections
              </button>
              <p className="text-purple-100 text-sm mt-2">
                Randomly selects categories, styles & seasons. Midjourney settings remain unchanged.
              </p>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mountain className="text-green-600" size={20} />
                Categories
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(categories).map(([key, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                        selectedCategories.includes(key)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <IconComponent size={24} />
                      <span className="text-sm font-medium capitalize">{key}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Styles */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="text-purple-600" size={20} />
                Photography Styles
              </h3>
              <div className="space-y-2">
                {Object.keys(styles).map(style => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedStyles.includes(style)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="font-medium capitalize">{style}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seasons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sun className="text-yellow-600" size={20} />
                Seasons
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(seasons).map(season => (
                  <button
                    key={season}
                    onClick={() => toggleSeason(season)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedSeasons.includes(season)
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <span className="font-medium capitalize">{season}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Midjourney Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="text-blue-600" size={20} />
                Midjourney Parameters
                <HelpCircle 
                  size={16} 
                  className="text-gray-400 cursor-help"
                  title="Klik ikon info di setiap parameter untuk penjelasan detail"
                />
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Version
                      <Info 
                        size={14} 
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setShowTooltip(showTooltip === 'version' ? null : 'version')}
                      />
                    </label>
                    {showTooltip === 'version' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                        <h4 className="font-semibold text-blue-800">{parameterExplanations.version.title}</h4>
                        <p className="text-blue-700">{parameterExplanations.version.description}</p>
                      </div>
                    )}
                    <select
                      value={mjSettings.version}
                      onChange={(e) => setMjSettings({...mjSettings, version: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="7.0">7.0 (Latest)</option>
                      <option value="6.1">6.1</option>
                      <option value="6.0">6.0</option>
                      <option value="5.2">5.2</option>
                      <option value="5.1">5.1</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Style
                      <Info 
                        size={14} 
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setShowTooltip(showTooltip === 'style' ? null : 'style')}
                      />
                    </label>
                    {showTooltip === 'style' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                        <h4 className="font-semibold text-blue-800">{parameterExplanations.style.title}</h4>
                        <p className="text-blue-700">{parameterExplanations.style.description}</p>
                      </div>
                    )}
                    <select
                      value={mjSettings.style}
                      onChange={(e) => setMjSettings({...mjSettings, style: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="raw">Raw (Realistis)</option>
                      <option value="cute">Cute (Imut)</option>
                      <option value="expressive">Expressive (Ekspresif)</option>
                      <option value="original">Original (Asli)</option>
                      <option value="scenic">Scenic (Pemandangan)</option>
                      <option value="none">None (Tidak Ada)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Quality: {mjSettings.quality}
                      <Info 
                        size={14} 
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setShowTooltip(showTooltip === 'quality' ? null : 'quality')}
                      />
                    </label>
                    {showTooltip === 'quality' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                        <h4 className="font-semibold text-blue-800">{parameterExplanations.quality.title}</h4>
                        <p className="text-blue-700">{parameterExplanations.quality.description}</p>
                      </div>
                    )}
                    <input
                      type="range"
                      min="0.25"
                      max="2"
                      step="0.25"
                      value={mjSettings.quality}
                      onChange={(e) => setMjSettings({...mjSettings, quality: e.target.value})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.25 (Cepat)</span>
                      <span>2 (Detail)</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Chaos: {mjSettings.chaos}
                      <Info 
                        size={14} 
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setShowTooltip(showTooltip === 'chaos' ? null : 'chaos')}
                      />
                    </label>
                    {showTooltip === 'chaos' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                        <h4 className="font-semibold text-blue-800">{parameterExplanations.chaos.title}</h4>
                        <p className="text-blue-700">{parameterExplanations.chaos.description}</p>
                      </div>
                    )}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={mjSettings.chaos}
                      onChange={(e) => setMjSettings({...mjSettings, chaos: e.target.value})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (Konsisten)</span>
                      <span>100 (Variasi)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Stylize: {mjSettings.stylize}
                      <Info 
                        size={14} 
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setShowTooltip(showTooltip === 'stylize' ? null : 'stylize')}
                      />
                    </label>
                    {showTooltip === 'stylize' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                        <h4 className="font-semibold text-blue-800">{parameterExplanations.stylize.title}</h4>
                        <p className="text-blue-700">{parameterExplanations.stylize.description}</p>
                      </div>
                    )}
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="25"
                      value={mjSettings.stylize}
                      onChange={(e) => setMjSettings({...mjSettings, stylize: e.target.value})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (Realistis)</span>
                      <span>1000 (Artistik)</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Weird: {mjSettings.weird}
                      <Info 
                        size={14} 
                        className="text-blue-500 cursor-pointer hover:text-blue-700"
                        onClick={() => setShowTooltip(showTooltip === 'weird' ? null : 'weird')}
                      />
                    </label>
                    {showTooltip === 'weird' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                        <h4 className="font-semibold text-blue-800">{parameterExplanations.weird.title}</h4>
                        <p className="text-blue-700">{parameterExplanations.weird.description}</p>
                      </div>
                    )}
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="50"
                      value={mjSettings.weird}
                      onChange={(e) => setMjSettings({...mjSettings, weird: e.target.value})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (Normal)</span>
                      <span>3000 (Aneh)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="tile"
                    checked={mjSettings.tile}
                    onChange={(e) => setMjSettings({...mjSettings, tile: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="tile" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Tile (seamless pattern)
                    <Info 
                      size={14} 
                      className="text-blue-500 cursor-pointer hover:text-blue-700"
                      onClick={() => setShowTooltip(showTooltip === 'tile' ? null : 'tile')}
                    />
                  </label>
                </div>
                {showTooltip === 'tile' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                    <h4 className="font-semibold text-blue-800">{parameterExplanations.tile.title}</h4>
                    <p className="text-blue-700">{parameterExplanations.tile.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Custom Parameters
                    <Info 
                      size={14} 
                      className="text-blue-500 cursor-pointer hover:text-blue-700"
                      onClick={() => setShowTooltip(showTooltip === 'customParams' ? null : 'customParams')}
                    />
                  </label>
                  {showTooltip === 'customParams' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 text-sm">
                      <h4 className="font-semibold text-blue-800">{parameterExplanations.customParams.title}</h4>
                      <p className="text-blue-700">{parameterExplanations.customParams.description}</p>
                    </div>
                  )}
                  <input
                    type="text"
                    value={mjSettings.customParams}
                    onChange={(e) => setMjSettings({...mjSettings, customParams: e.target.value})}
                    placeholder="e.g., --no people, --upbeta"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">Preview:</p>
                  <p className="text-xs text-gray-500 font-mono">{generateMjParams()}</p>
                </div>
              </div>
            </div>

            {/* Basic Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={selectedAspectRatio}
                    onChange={(e) => setSelectedAspectRatio(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(aspectRatios).map(([ratio, description]) => (
                      <option key={ratio} value={ratio}>
                        {ratio} - {description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Prompts: {promptCount}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={promptCount}
                    onChange={(e) => setPromptCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10</span>
                    <span>200</span>
                  </div>
                </div>

                <button
                  onClick={generatePrompts}
                  disabled={isGenerating || selectedCategories.length === 0}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Shuffle size={20} />
                      Generate Prompts
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Generated Prompts ({generatedPrompts.length})
                </h3>
                {generatedPrompts.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyAllPrompts}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Copy All
                    </button>
                    <button
                      onClick={exportPrompts}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Download size={16} />
                      Export JSON
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                {generatedPrompts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select categories and click "Generate Prompts" to start</p>
                  </div>
                ) : (
                  generatedPrompts.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex gap-2 mb-2">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              {item.style}
                            </span>
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              {item.season}
                            </span>
                          </div>
                          <div className="bg-gray-800 text-green-400 p-3 rounded-lg font-mono text-sm">
                            <span className="text-blue-400">/imagine</span> {item.prompt}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`/imagine ${item.prompt}`)}
                          className="text-gray-500 hover:text-blue-500 transition-colors duration-200"
                          title="Copy to clipboard"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Parameter Guide Section - Collapsible */}
        <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-200 flex items-center justify-between"
          >
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="text-blue-600" size={24} />
              📖 Panduan Parameter Midjourney untuk Pemula
            </h3>
            {showGuide ? <ChevronUp className="text-gray-600" size={24} /> : <ChevronDown className="text-gray-600" size={24} />}
          </button>
          
          {showGuide && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Settings size={18} />
                    Version & Style
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-blue-700">V7.0:</span>
                      <p className="text-blue-600">Terbaru, hasil terbaik, fitur lengkap</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-700">Style Raw:</span>
                      <p className="text-blue-600">Foto realistis, ideal untuk stock</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-700">Style Scenic:</span>
                      <p className="text-blue-600">Pemandangan dramatis</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <Sparkles size={18} />
                    Quality & Rendering
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-green-700">Q 2:</span>
                      <p className="text-green-600">Kualitas tinggi (4x detail), untuk stock premium</p>
                    </div>
                    <div>
                      <span className="font-semibold text-green-700">Q 1:</span>
                      <p className="text-green-600">Standar, balance waktu vs kualitas</p>
                    </div>
                    <div>
                      <span className="font-semibold text-green-700">Q 0.5:</span>
                      <p className="text-green-600">Cepat, untuk testing ide</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <Shuffle size={18} />
                    Variasi & Eksperimen
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-purple-700">Chaos 0:</span>
                      <p className="text-purple-600">Hasil konsisten, predictable</p>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">Chaos 50:</span>
                      <p className="text-purple-600">Balance variasi vs konsistensi</p>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">Chaos 100:</span>
                      <p className="text-purple-600">Sangat bervariasi, eksperimental</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <Camera size={18} />
                    Artistic Control
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-orange-700">Stylize 0:</span>
                      <p className="text-orange-600">Sangat realistis, foto murni</p>
                    </div>
                    <div>
                      <span className="font-semibold text-orange-700">Stylize 100:</span>
                      <p className="text-orange-600">Balance ideal untuk stock photography</p>
                    </div>
                    <div>
                      <span className="font-semibold text-orange-700">Stylize 500+:</span>
                      <p className="text-orange-600">Artistic, ilustratif</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  💡 Tips untuk Stock Photography
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
                  <div>
                    <span className="font-semibold">Rekomendasi Setting:</span>
                    <p>Version 7.0, Style Raw, Quality 2, Chaos 0-25, Stylize 50-150</p>
                  </div>
                  <div>
                    <span className="font-semibold">Custom Parameters:</span>
                    <p>Gunakan "--no people" untuk landscape murni, "--ar 4:5" untuk Instagram</p>
                  </div>
                  <div>
                    <span className="font-semibold">Weird Parameter:</span>
                    <p>Hindari nilai tinggi untuk stock, gunakan 0-100 max</p>
                  </div>
                  <div>
                    <span className="font-semibold">Tile Feature:</span>
                    <p>Aktifkan untuk texture/pattern yang bisa diulang seamless</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">💡 Pro Tips for Adobe Stock Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div className="text-center">
              <h4 className="font-semibold text-green-600 mb-2">Market Trends</h4>
              <p>Focus on conservation themes, Arctic/polar regions, and authentic environmental storytelling for premium pricing</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-blue-600 mb-2">Technical Excellence</h4>
              <p>Use 4:5 aspect ratio for mobile optimization, master golden/blue hour timing, and embrace subtle HDR processing</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-purple-600 mb-2">Random & Parameter Features</h4>
              <p>Use "Randomize" for creative exploration, "Random + Generate" for instant variety. Midjourney parameters stay persistent for consistency!</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-orange-600 mb-2">Revenue Strategy</h4>
              <p>Upload 50-100 images monthly, maintain 60% evergreen content, and target corporate sustainability market</p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NaturePromptGenerator;
