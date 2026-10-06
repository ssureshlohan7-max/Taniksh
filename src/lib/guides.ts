export type Guide = {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "voice-commands-guide",
    title: "How to Control Your Browser With Voice Commands",
    summary:
      "A practical guide to opening websites, searching and sending messages hands-free with J.A.R.V.I.S.",
    sections: [
      {
        heading: "Why voice control is useful",
        body: [
          "Voice control saves time when your hands are busy — cooking, driving a desk full of paperwork, or simply relaxing on the sofa. Instead of tapping through menus, you say what you want and the assistant does the routine work for you.",
          "J.A.R.V.I.S. runs entirely inside your web browser. There is nothing to install: open the page, allow microphone access once, and start talking.",
        ],
      },
      {
        heading: "Three ways to talk",
        body: [
          "TALK listens for a single sentence. Press it, speak, and the assistant answers when you stop.",
          "WAKE keeps the microphone open in the background and reacts only when you say “Hey Jarvis” followed by your request — ideal when you want the assistant on standby.",
          "LIVE TALK is fully hands-free. Every sentence you say is treated as a request, and the assistant pauses its listening while it speaks so it never hears itself.",
        ],
      },
      {
        heading: "Useful commands to try",
        body: [
          "“Open YouTube”, “Search YouTube for lo-fi music”, “Search Google for today’s weather”, “Find running shoes on Amazon” and “Show petrol pumps on Maps” all work instantly because they are handled directly on your device.",
          "For messaging, say “Send a WhatsApp message to 98XXXXXXXX saying hello”. The chat opens with your text already typed — you press send yourself, which keeps you in control.",
          "Device commands such as “fullscreen”, “battery”, “vibrate” and “keep screen on” use standard browser features.",
        ],
      },
      {
        heading: "What a browser cannot do",
        body: [
          "For your safety, browsers do not allow any website to switch off your phone, end or mute calls, or control other installed apps. When you ask for a phone call, J.A.R.V.I.S. opens your dialer with the number filled in and you tap the call button.",
        ],
      },
    ],
  },
  {
    slug: "build-a-website-with-ai",
    title: "Build and Publish a Website With AI in Five Minutes",
    summary:
      "Step-by-step instructions for describing, editing, and sharing a complete website using the Site Forge.",
    sections: [
      {
        heading: "Start with a clear description",
        body: [
          "The better you describe your business, the better the first draft. Mention what you sell, who your customers are, the sections you need (for example pricing, gallery, contact) and the mood you want — calm, bold, luxurious or playful.",
          "Example: “A website for a neighbourhood bakery with a daily menu, opening hours, a pre-order section and warm, rustic colours.”",
        ],
      },
      {
        heading: "Refine it by chatting",
        body: [
          "After the first version appears in the live preview, keep chatting. Ask for changes the way you would ask a designer: “make the background dark blue”, “add customer reviews”, “change the headline to Fresh Bread Every Morning”.",
          "Each change updates the whole page, so you can experiment freely and download the HTML at any time.",
        ],
      },
      {
        heading: "Choose your address and publish",
        body: [
          "Press PUBLISH to make the website public. Then pick a memorable address such as taniksh.lovable.app/s/my-bakery in the Website Address box and save it.",
          "Use COPY LINK, SHARE or WHATSAPP to send the link to customers. You can unpublish or delete a site whenever you like from the My Sites list.",
        ],
      },
      {
        heading: "Tips for a better result",
        body: [
          "Use real information — your actual phone number, address and prices — because the AI cannot know them. Keep each change request focused on one or two things, and review the page on both phone and desktop before sharing it widely.",
        ],
      },
    ],
  },
  {
    slug: "ai-photo-editing-basics",
    title: "AI Photo Editing Basics: Better Prompts, Better Pictures",
    summary:
      "Learn how to write prompts that produce great AI-edited and AI-generated images in the Photo Lab.",
    sections: [
      {
        heading: "Editing versus generating",
        body: [
          "When you upload or capture a photo, the Photo Lab edits that picture according to your instructions. Without a photo, it creates a brand-new image from your description.",
        ],
      },
      {
        heading: "Write prompts like a photographer",
        body: [
          "Describe the subject, the setting, the lighting and the style. “A cup of chai on a wooden table, morning sunlight from the left, soft focus background, warm tones” gives far better results than “tea photo”.",
          "For edits, say exactly what should change and what should stay: “Replace the background with a beach at sunset, keep the person unchanged.”",
        ],
      },
      {
        heading: "Respect people and rights",
        body: [
          "Only edit photos you own or have permission to use, and never create misleading images of real people. Generated images are best used for creative projects, mock-ups and social media visuals.",
        ],
      },
    ],
  },
  {
    slug: "customize-your-assistant",
    title: "Customize Your Assistant: Name, Voice, Theme and Shortcuts",
    summary:
      "Make J.A.R.V.I.S. your own with personalities, voices, colour themes and custom voice shortcuts.",
    sections: [
      {
        heading: "Identity and personality",
        body: [
          "Open SETTINGS on the home screen to rename the assistant, change the wake word and pick a personality: Classic, Friendly, Formal, Witty or Hype. The personality changes the tone of every answer.",
        ],
      },
      {
        heading: "Voice and language",
        body: [
          "Choose any voice installed on your device and adjust speed and pitch. The Voice Dialect switch toggles between English and Haryanvi/Hindi replies.",
        ],
      },
      {
        heading: "Themes and backgrounds",
        body: [
          "Pick a colour theme such as Arc Blue, Gold, Crimson, Emerald or Violet, and add a background photo — upload your own or generate one with AI. All settings are saved in your browser only.",
        ],
      },
      {
        heading: "Custom shortcuts",
        body: [
          "Create your own phrases that open a specific link. For example, map “open my shop” to your published website, or “class notes” to a shared document. Shortcuts are checked before any other command, so they respond instantly.",
        ],
      },
    ],
  },
];
