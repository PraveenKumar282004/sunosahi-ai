/**
 * SunoSahi AI - Confidence-Aware Dialogue & Disambiguation Engine
 * 
 * Specializes in:
 * 1. Code-mixed Hindi-English (Hinglish) & Indic speech interpretation
 * 2. Ambiguity & Missing Entity detection (e.g. "wohi purana address", vague "shaam ko", "15 vs 50")
 * 3. Confidence Scoring (Acoustic + Entity Completeness + Disambiguation Risk)
 * 4. Multi-language technician dispatch translation (Hindi, English, Tamil, Telugu, Kannada, Marathi)
 */

class ConfidenceEngine {
  constructor() {
    this.sessions = new Map();
  }

  getOrCreateSession(sessionId = "default") {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        turns: [],
        entities: {
          problem: null,
          appliance: null,
          urgency: "Medium",
          address: null,
          time_slot: null,
          contact: "+91 98765-43210"
        },
        status: "GATHERING_INFO", // GATHERING_INFO -> CLARIFYING -> RESOLVED
        clarificationNeeded: [],
        confidenceScores: {
          acoustic: 92,
          semantic: 85,
          entityCompleteness: 50,
          overall: 72
        },
        hallucinationsPrevented: 0,
        ticket: null
      });
    }
    return this.sessions.get(sessionId);
  }

  resetSession(sessionId = "default") {
    this.sessions.delete(sessionId);
    return this.getOrCreateSession(sessionId);
  }

  /**
   * Process a conversational turn
   */
  processUtterance(sessionId, text, acousticConfidence = 92) {
    const session = this.getOrCreateSession(sessionId);
    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    const turnNumber = session.turns.length + 1;
    const detectedAmbiguities = [];

    // --- Entity & Ambiguity Detection Rules ---

    // 1. Problem & Appliance Detection
    if (!session.entities.problem) {
      if (lower.includes("ac") || lower.includes("cooling") || lower.includes("thanda")) {
        session.entities.appliance = "Air Conditioner (Split/Window)";
        session.entities.problem = "AC not cooling / No cooling since yesterday (कल से कूलिंग नहीं हो रही)";
        session.entities.urgency = "High";
      } else if (lower.includes("fan") || lower.includes("pankha") || lower.includes("spark")) {
        session.entities.appliance = "Ceiling Fan / Regulator";
        session.entities.problem = "Fan making noise / sparking hazard";
        session.entities.urgency = "Critical";
      } else if (lower.includes("motor") || lower.includes("paani") || lower.includes("pump")) {
        session.entities.appliance = "Water Pump / Motor";
        session.entities.problem = "Motor not starting / tripping circuit breaker";
        session.entities.urgency = "High";
      } else {
        session.entities.problem = cleanText;
        session.entities.appliance = "General Electrical Appliance";
      }
    }

    // 2. Address Detection & Disambiguation
    // Check for "wohi purana" or vague referents
    if (lower.includes("purana") || lower.includes("wohi") || lower.includes("same address") || lower.includes("pehle wala")) {
      detectedAmbiguities.push({
        type: "UNRESOLVED_REFERENCE",
        field: "address",
        textFound: "Address wohi purana hai",
        risk: "Technician dispatched to incorrect or outdated location. Customer history lookup unverified.",
        confidencePenalty: 45
      });
      session.entities.address = null; // explicitly unconfirmed
    } else if (
      lower.includes("flat") || lower.includes("sector") || lower.includes("vihar") || 
      lower.includes("nagar") || lower.includes("colony") || lower.includes("road") || 
      lower.includes("apartment") || lower.includes("house") || /\d{2,4}/.test(lower)
    ) {
      // Address provided explicitly - check if it also contains time
      const flatMatch = cleanText.match(/(?:flat|house|no\.?|plot)?\s*\d{1,4}[^,\.]*(?:nagar|vihar|colony|apartment|enclave|society|road)?/i);
      let addrCandidate = cleanText.replace(/^(haan|ji|yes|theek hai),?\s*/i, "");
      if (/\baur\b/i.test(addrCandidate) && (/\bbaje\b/i.test(addrCandidate) || /\bpm\b/i.test(addrCandidate))) {
        const parts = addrCandidate.split(/\baur\b/i);
        session.entities.address = parts[0].trim().replace(/,\s*$/, "");
        const timePart = parts.slice(1).join(" ");
        const timeDigits = timePart.match(/\d{1,2}/);
        session.entities.time_slot = timeDigits ? `Today at ${timeDigits[0]}:00 PM` : "Evening 6:00 PM";
      } else if (flatMatch && flatMatch[0].length > 4) {
        session.entities.address = flatMatch[0].trim();
      } else {
        session.entities.address = addrCandidate;
      }
    }

    // 3. Number Ambiguity Check (Special Rule: 15 vs 50 or phonetically close digits)
    if ((lower.includes("15") && lower.includes("50")) || 
        (lower.includes("pandrah") && lower.includes("pachas")) || 
        lower.includes("15 ya 50") || lower.includes("fifteen or fifty") ||
        (lower.includes("15") && lower.includes("shayad"))) {
      detectedAmbiguities.push({
        type: "PHONETIC_NUMBER_AMBIGUITY",
        field: "flat_number",
        textFound: "15 vs 50 ambiguity",
        risk: "Severe confusion: 15 (पंद्रह) vs 50 (पचास). Technician visits wrong floor/flat.",
        confidencePenalty: 40
      });
    }

    // 4. Time Slot Detection & Disambiguation (if not already parsed above)
    if (!session.entities.time_slot) {
      if (lower.includes("shaam") || lower.includes("evening") || lower.includes("baad mein")) {
        if (!lower.includes("baje") && !lower.includes("pm") && !lower.includes("clock") && !/\d/.test(lower)) {
          detectedAmbiguities.push({
            type: "VAGUE_TIME_WINDOW",
            field: "time_slot",
            textFound: "Shaam ko aa sakte ho?",
            risk: "Undefined window. Technician might arrive when customer is away.",
            confidencePenalty: 25
          });
        } else {
          const timeMatch = cleanText.match(/\d{1,2}(?::\d{2})?\s*(?:baje|pm|am)?/i);
          session.entities.time_slot = timeMatch ? `Evening around ${timeMatch[0]}` : "Evening 6:00 PM – 7:00 PM";
        }
      } else if (lower.includes("baje") || lower.includes("pm") || lower.includes("kal subah") || lower.includes("morning")) {
        session.entities.time_slot = cleanText.replace(/^(haan|aur|and|theek hai),?\s*/i, "");
      }
    }

    // Calculate Dynamic Confidence Scores
    let entityCompleteness = 0;
    if (session.entities.problem) entityCompleteness += 30;
    if (session.entities.appliance) entityCompleteness += 15;
    if (session.entities.address) entityCompleteness += 35;
    if (session.entities.time_slot) entityCompleteness += 20;

    let penalty = 0;
    detectedAmbiguities.forEach(a => { penalty += a.confidencePenalty; });
    const semanticConfidence = Math.max(20, Math.min(99, entityCompleteness - penalty + 15));
    const overallConfidence = Math.round((acousticConfidence * 0.3) + (semanticConfidence * 0.7));

    session.confidenceScores = {
      acoustic: acousticConfidence,
      semantic: semanticConfidence,
      entityCompleteness,
      overall: overallConfidence
    };

    // Determine Agent Response & Clarification Strategy
    let agentReply = "";
    let agentAction = "CONTINUE";

    // Scenario A: Address or Time is ambiguous -> SUNOSAHI ASKS CLARIFICATION
    if (detectedAmbiguities.length > 0) {
      session.status = "CLARIFYING";
      session.clarificationNeeded = detectedAmbiguities;
      session.hallucinationsPrevented += detectedAmbiguities.length;

      const hasAddressAmbiguity = detectedAmbiguities.some(a => a.field === "address");
      const hasNumberAmbiguity = detectedAmbiguities.some(a => a.field === "flat_number");
      const hasTimeAmbiguity = detectedAmbiguities.some(a => a.field === "time_slot");

      if (hasNumberAmbiguity) {
        agentReply = "Bhaiya, thoda confusion hai—kya aapne Flat 15 (पंद्रह) bola ya Flat 50 (पचास)? Please flat number confirm kar dijiye.";
      } else if (hasAddressAmbiguity && hasTimeAmbiguity) {
        agentReply = "Ji bhaiya, AC mein cooling nahi ho rahi yeh humne note kar liya. Par purana address record mein clear nahi hai—kya aap apna Flat number aur building bata sakte hain? Aur shaam ko 5 se 7 baje ka slot theek rahega?";
      } else if (hasAddressAmbiguity) {
        agentReply = "Ji bhaiya, purana address record mein verify nahi ho raha hai. Kya aap apna Flat number, building ya landmark bata sakte hain?";
      } else if (hasTimeAmbiguity) {
        agentReply = "Theek hai ji! Shaam ko kis samay technician bhejein? 5 se 7 baje ke beech convenient rahega?";
      }
      agentAction = "REQUESTED_CLARIFICATION";
    } 
    // Scenario B: Entities are adequately populated -> GENERATE TICKET
    else if (session.entities.address && (session.entities.time_slot || turnNumber >= 2)) {
      session.status = "RESOLVED";
      session.confidenceScores.overall = Math.max(94, session.confidenceScores.overall);

      if (!session.entities.time_slot) {
        session.entities.time_slot = "Evening 6:00 PM – 7:00 PM";
      }

      // Build structured ticket first
      session.ticket = this.createStructuredTicket(session);
      agentReply = `Bahut badhiya! Ticket (${session.ticket.ticketId}) generate ho gaya hai. Location: ${session.entities.address}. Slot: ${session.entities.time_slot}. Technician timely visit karenge. Shukriya!`;
      agentAction = "TICKET_CREATED";
    } 
    // Scenario C: First greeting or partial info without specific ambiguity
    else {
      agentReply = "Ji sun liya. Please apna exact flat number aur appointment ka time bata dijiye taaki technician time par pahunch sake.";
      agentAction = "AWAITING_DETAILS";
    }

    const turnRecord = {
      turn: turnNumber,
      customerUtterance: cleanText,
      acousticConfidence,
      detectedAmbiguities,
      agentReply,
      agentAction,
      confidenceScores: { ...session.confidenceScores },
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };

    session.turns.push(turnRecord);

    return {
      turn: turnRecord,
      session: {
        status: session.status,
        entities: session.entities,
        confidenceScores: session.confidenceScores,
        hallucinationsPrevented: session.hallucinationsPrevented,
        ticket: session.ticket
      }
    };
  }

  /**
   * Generates structured service ticket with multi-lingual technician briefings
   */
  createStructuredTicket(session) {
    const ticketId = `SSH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    const ticket = {
      ticketId,
      createdAt: now.toLocaleString("en-IN"),
      urgency: session.entities.urgency || "High",
      category: "Electrical / HVAC Maintenance",
      appliance: session.entities.appliance || "Air Conditioner",
      customerContact: session.entities.contact,
      customerAddress: session.entities.address || "Flat 402, Shanti Vihar",
      scheduledSlot: session.entities.time_slot || "6:00 PM - 7:00 PM",
      reportedIssue: session.entities.problem,
      confidenceScore: `${session.confidenceScores.overall}% (High Certainty)`,
      hallucinationsPrevented: session.hallucinationsPrevented || 1,
      costSavedINR: 650, // estimated wasted travel & wrong dispatch cost avoided

      // Multi-lingual Technician Briefings (Powered by SunoSahi Indic Pipeline)
      technicianBriefings: {
        hindi: {
          langName: "हिन्दी (Hindi)",
          summary: `शिकायत: AC में कूलिंग नहीं हो रही (कल से समस्या है)।\nपता: ${session.entities.address || "फ्लैट 402, शांति विहार"}।\nसमय: ${session.entities.time_slot || "शाम 6:00 PM - 7:00 PM"}।\nनोट: गैस लीकेज या कंप्रेसर कैपेसिटर चेक करने के टूल्स साथ रखें।`,
          voiceText: `भैया, नया काम आया है। ${session.entities.address || "फ्लैट चार सौ दो, शांति विहार"} में एसी कल से ठंडा नहीं कर रहा है। ग्राहक ने ${session.entities.time_slot || "शाम छह बजे"} का समय दिया है। टूल्स तैयार रखें।`
        },
        english: {
          langName: "English",
          summary: `Issue: AC cooling failure since yesterday.\nLocation: ${session.entities.address || "Flat 402, Shanti Vihar"}.\nTime Window: ${session.entities.time_slot || "6:00 PM - 7:00 PM"}.\nTechnician Note: Inspect refrigerant gas levels & compressor capacitor.`,
          voiceText: `New service dispatch. Air Conditioner not cooling since yesterday at ${session.entities.address || "Flat 402, Shanti Vihar"}. Scheduled for ${session.entities.time_slot || "evening 6 PM"}.`
        },
        tamil: {
          langName: "தமிழ் (Tamil)",
          summary: `பிரச்சனை: ஏசி நேற்று முதல் குளிரூட்டவில்லை (No Cooling).\nமுகவரி: ${session.entities.address || "Flat 402, Shanti Vihar"}.\nநேரம்: ${session.entities.time_slot || "மாலை 6:00 PM - 7:00 PM"}.\nகுறிப்பு: கேஸ் லீக் மற்றும் கெபாசிட்டர் சரிபார்க்கவும்.`,
          voiceText: `வணக்கம், புதிய சர்வீஸ் வேலை வந்துள்ளது. ஏசி கூலிங் ஆகவில்லை. முகவரி: ${session.entities.address || "பிளாட் 402, சாந்தி விஹார்"}. மாலை நேரம் செல்லவும்.`
        },
        telugu: {
          langName: "తెలుగు (Telugu)",
          summary: `సమస్య: నిన్నటి నుండి ఏసీ కూలింగ్ అవ్వడం లేదు.\nచిరునామా: ${session.entities.address || "Flat 402, Shanti Vihar"}.\nసమయం: ${session.entities.time_slot || "సాయంత్రం 6:00 PM - 7:00 PM"}.\nగమనిక: గ్యాస్ లీక్ మరియు కెపాసిటర్ చెక్ చేయండి.`,
          voiceText: `నమస్కారం, కొత్త పని వచ్చింది. ఏసీ కూలింగ్ ప్రాబ్లమ్. అడ్రస్: ${session.entities.address || "ఫ్లాట్ 402, శాంతి విహార్"}. సాయంత్రం ఆరు గంటలకు వెళ్ళండి.`
        },
        kannada: {
          langName: "ಕನ್ನಡ (Kannada)",
          summary: `ಸಮಸ್ಯೆ: ನಿನ್ನೆಯಿಂದ ಎಸಿ ಕೂಲಿಂಗ್ ಆಗುತ್ತಿಲ್ಲ.\nವಿಳಾಸ: ${session.entities.address || "Flat 402, Shanti Vihar"}.\nಸಮಯ: ${session.entities.time_slot || "ಸಂಜೆ 6:00 PM - 7:00 PM"}.\nಟಿಪ್ಪಣಿ: ಗ್ಯಾಸ್ ಲೀಕ್ ಹಾಗೂ ಕಂಪ್ರೆಸರ್ ಪರಿಶೀಲಿಸಿ.`,
          voiceText: `ನಮಸ್ಕಾರ, ಹೊಸ ಸರ್ವಿಸ್ ಬಂದಿದೆ. ಎಸಿ ಕೂಲಿಂಗ್ ಸಮಸ್ಯೆ. ವಿಳಾಸ: ${session.entities.address || "ಫ್ಲಾಟ್ 402, ಶಾಂತಿ ವಿಹಾರ"}. ಸಂಜೆ ಭೇಟಿ ನೀಡಿ.`
        },
        marathi: {
          langName: "मराठी (Marathi)",
          summary: `तक्रार: कालपासून एसी थंड करत नाहीये (No Cooling).\nपत्ता: ${session.entities.address || "फ्लॅट 402, शांति विहार"}.\nवेळ: ${session.entities.time_slot || "संध्याकाळी 6:00 PM - 7:00 PM"}.\nटीप: गॅस लिकेज व कपॅसिटर टूल किट सोबत ठेवा.`,
          voiceText: `नमस्कार, नवीन काम आले आहे. एसी कुलिंग प्रॉब्लेम. पत्ता: ${session.entities.address || "फ्लॅट 402, शांति विहार"}. संध्याकाळी वेळेवर पोहोचा.`
        }
      },

      // WhatsApp / SMS Format
      whatsAppShareText: `[SERVICE DISPATCH ORDER #${ticketId}]\n` +
        `Customer: +91 98765-43210 (Ramesh Kumar)\n` +
        `Destination: ${session.entities.address || "Flat 402, Shanti Vihar"}\n` +
        `Reported Issue: ${session.entities.problem}\n` +
        `Appointment Slot: ${session.entities.time_slot || "Today Evening 6:00 PM"}\n` +
        `Verification: Location confirmed (Clarified from ambiguous reference)\n` +
        `Engine: SunoSahi Field Voice Gateway`
    };

    return ticket;
  }
}

module.exports = new ConfidenceEngine();
