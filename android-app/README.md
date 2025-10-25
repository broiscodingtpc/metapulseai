# MetaPulse AI Admin - Android App

Aplicația Android pentru administrarea sistemului MetaPulse AI.

## 🚀 Funcționalități

### 📱 **Ecrane Principale**
- **Home Screen**: Status sistem, control analyzer, navigare
- **Analyzer Screen**: Analiză manuală token-uri
- **Test Screen**: Testare API-uri individuale și complete
- **Settings Screen**: Configurare conexiune și setări app

### 🔧 **Funcții Admin**
- **Control Analyzer**: Start/Stop/Clear Cache
- **Monitorizare Status**: Tokens procesate, uptime, status
- **Testare API**: Dexscreener, PumpPortal, Groq, Telegram
- **Analiză Token**: Input manual mint address pentru analiză AI

### ⚙️ **Setări**
- **API URL**: Configurare adresă server
- **Notificări**: Enable/disable push notifications
- **Auto Refresh**: Refresh automat status
- **Interval Refresh**: Configurare interval (secunde)

## 📋 **Cerințe**

### **Development**
- Node.js 16+
- React Native CLI
- Android Studio
- Android SDK (API 21+)
- Java 11+

### **Runtime**
- Android 5.0+ (API 21)
- Conexiune internet
- Acces la rețeaua locală (pentru conectare la server)

## 🛠️ **Instalare & Setup**

### **1. Instalare Dependencies**
```bash
cd android-app
npm install
```

### **2. Setup Android**
```bash
# Asigură-te că Android SDK este instalat
# Conectează device-ul Android sau pornește emulator
adb devices
```

### **3. Build & Run**
```bash
# Development build
npm run android

# Production build
npm run build

# Install APK
npm run install-apk
```

## 📱 **Utilizare**

### **1. Prima Configurare**
1. Deschide aplicația
2. Mergi la **Settings**
3. Introdu IP-ul computerului + port 5174
   - Exemplu: `http://192.168.1.100:5174`
4. Testează conexiunea
5. Salvează setările

### **2. Control Sistem**
1. **Home Screen** - Vezi status sistem
2. **Start Analyzer** - Pornește sistemul de analiză
3. **Stop Analyzer** - Oprește sistemul
4. **Clear Cache** - Șterge cache-ul token-urilor procesate

### **3. Analiză Token**
1. Mergi la **Analyzer Screen**
2. Introdu mint address-ul token-ului
3. Apasă **ANALYZE**
4. Vezi rezultatele: score, sentiment, risc, categorie

### **4. Testare API**
1. Mergi la **Test Screen**
2. Testează conexiunea
3. Testează API-uri individuale
4. Rulează **TEST ALL APIS** pentru verificare completă

## 🔧 **Configurare Rețea**

### **Găsirea IP-ului Computerului**

**Windows:**
```cmd
ipconfig
# Caută "IPv4 Address" pentru rețeaua ta
```

**macOS/Linux:**
```bash
ifconfig
# Caută "inet" pentru interfața ta de rețea
```

### **Configurare Firewall**
Asigură-te că portul 5174 este deschis în firewall pentru conexiuni locale.

**Windows Firewall:**
1. Windows Security → Firewall & network protection
2. Advanced settings → Inbound Rules → New Rule
3. Port → TCP → 5174 → Allow

## 📊 **Features Detaliate**

### **Home Screen**
- **System Status**: Running/Stopped, tokens procesate, uptime
- **Quick Controls**: Start/Stop analyzer, clear cache, refresh
- **Navigation**: Acces rapid la toate ecranele

### **Analyzer Screen**
- **Manual Analysis**: Input mint address pentru analiză
- **AI Results**: Score 0-100, sentiment, categorie meta, risc
- **Key Points**: Puncte cheie din analiza AI
- **Real-time**: Rezultate în timp real de la Groq AI

### **Test Screen**
- **Connection Test**: Verifică conectivitatea la server
- **Individual APIs**: Test Dexscreener, PumpPortal, Groq, Telegram
- **Comprehensive Test**: Test toate API-urile simultan
- **Detailed Results**: Status, erori, metrici pentru fiecare API

### **Settings Screen**
- **Connection**: Configurare URL server, test conexiune
- **App Settings**: Notificări, auto-refresh, interval
- **System Info**: Versiune app, status conexiune
- **Reset**: Resetare la setări default

## 🎨 **Design**

### **Tema Console**
- **Culori**: Verde matrix (#00ff41), fundal negru (#0a0a0a)
- **Font**: Monospace pentru aspect terminal
- **ASCII Art**: Borduri și decorații în stil console
- **Status Badges**: Culori codate pentru status (verde/galben/roșu)

### **Componente Custom**
- **ConsoleCard**: Container cu borduri ASCII
- **StatusBadge**: Badge-uri colorate pentru status
- **Responsive**: Adaptare la diferite dimensiuni ecran

## 🔒 **Securitate**

### **Conexiuni**
- **HTTP Local**: Doar pentru rețeaua locală
- **No Auth**: Nu stochează credențiale sensibile
- **Local Storage**: Doar setări app în AsyncStorage

### **Permisiuni**
- **INTERNET**: Pentru conexiuni API
- **ACCESS_NETWORK_STATE**: Pentru verificare conectivitate
- **WAKE_LOCK**: Pentru menținere conexiune
- **VIBRATE**: Pentru notificări

## 🐛 **Troubleshooting**

### **Probleme Comune**

**1. Nu se conectează la server**
- Verifică IP-ul computerului
- Asigură-te că serverul rulează pe portul 5174
- Verifică firewall-ul
- Testează din browser: `http://IP:5174`

**2. API-uri nu funcționează**
- Verifică API keys în server
- Testează individual fiecare API
- Verifică logs în server

**3. App crash**
- Verifică versiunea Android (min API 21)
- Reinstalează aplicația
- Verifică logs cu `adb logcat`

### **Debug**
```bash
# Vezi logs Android
adb logcat | grep MetaPulse

# Debug React Native
npx react-native log-android
```

## 📈 **Viitoare Features**

- **Push Notifications**: Alerte pentru token-uri noi
- **Dark/Light Theme**: Teme multiple
- **Offline Mode**: Funcționalitate limitată offline
- **Export Data**: Export rezultate analize
- **Multi-Server**: Conectare la multiple servere
- **Widgets**: Widget-uri pentru home screen

## 📞 **Support**

Pentru probleme sau întrebări:
1. Verifică documentația
2. Testează conexiunea în Settings
3. Verifică logs pentru erori
4. Reinstalează aplicația dacă e necesar

---

**MetaPulse AI Admin v1.0** - Feel the pulse before the market does! 🚀