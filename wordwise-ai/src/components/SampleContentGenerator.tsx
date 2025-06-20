import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Copy, BookOpen, ChevronDown, Check } from "lucide-react";

interface SampleContentGeneratorProps {
  writingType: string;
  onSampleSelect?: (content: string) => void;
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

const SampleContentGenerator: React.FC<SampleContentGeneratorProps> = ({ 
  writingType, 
  onSampleSelect: _onSampleSelect 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('intermediate');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);

  const difficultyLevels = [
    { 
      value: 'beginner' as const, 
      label: 'Beginner', 
      description: 'Simple vocabulary and structures',
      wordRange: '150-250 words',
      color: 'bg-green-50 border-green-200 text-green-800',
      badge: 'bg-green-100'
    },
    { 
      value: 'intermediate' as const, 
      label: 'Intermediate', 
      description: 'Moderate complexity and vocabulary',
      wordRange: '250-400 words',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      badge: 'bg-blue-100'
    },
    { 
      value: 'advanced' as const, 
      label: 'Advanced', 
      description: 'Complex vocabulary and sophisticated ideas',
      wordRange: '400-600 words',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      badge: 'bg-purple-100'
    }
  ];

  const generateSampleContent = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const prompt = createPromptForWritingType(writingType, selectedLevel);
      
      // Use OpenAI API to generate content
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured');
      }

      // Add random user message to ensure different responses
      const randomInstructions = [
        'Create something completely fresh and unique.',
        'Generate entirely new content, avoid common topics.',
        'Make this totally different from typical examples.',
        'Create an original and creative piece.',
        'Generate something unexpected and engaging.',
        'Avoid overused topics, be innovative.',
        'Create content that stands out from the norm.',
        'Generate something truly unique and memorable.'
      ];
      const randomInstruction = randomInstructions[Math.floor(Math.random() * randomInstructions.length)];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a creative writing instructor who specializes in generating diverse, unique sample content for ESL students. 

CRITICAL REQUIREMENTS:
- Create completely different content each time
- NEVER repeat topics like "my favorite hobby", "my family", "my school" 
- Avoid cliché or overused subjects
- Generate fresh, engaging, and varied content
- Each piece should be unique and memorable
- Focus on originality and creativity
- Ensure no two pieces are similar

Your goal is to provide students with diverse, high-quality examples that showcase different writing styles, topics, and approaches.`
            },
            {
              role: 'user',
              content: `${prompt}\n\nAdditional instruction: ${randomInstruction}`
            }
          ],
          temperature: 0.9, // Higher temperature for more creativity and variation
          max_tokens: 700, // More tokens for detailed content
          top_p: 0.95, // Allow more diverse token selection
          frequency_penalty: 0.3, // Reduce repetition
          presence_penalty: 0.4, // Encourage new topics
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      setGeneratedContent(content);
    } catch (err) {
      console.error('Error generating sample content:', err);
      setError('Failed to generate sample content. Please try again.');
      // Enhanced fallback with random content
      setGeneratedContent(getRandomMockContent(writingType, selectedLevel));
    } finally {
      setIsGenerating(false);
    }
  };

  const createPromptForWritingType = (type: string, level: DifficultyLevel): string => {
    // Enhanced random elements for more variety
    const randomTopics = {
      essay: [
        'The Impact of Social Media on Modern Communication',
        'Climate Change and Individual Responsibility', 
        'The Benefits and Drawbacks of Remote Work',
        'The Role of Technology in Education',
        'Cultural Diversity in the Workplace',
        'The Importance of Mental Health Awareness',
        'Sustainable Living in Urban Areas',
        'The Future of Artificial Intelligence',
        'The Value of Learning a Second Language',
        'Work-Life Balance in the Digital Age',
        'The Influence of Music on Human Emotions',
        'Urban Gardening and Community Building',
        'The Rise of Online Learning Platforms',
        'Digital Privacy in the Modern World',
        'The Art of Effective Communication',
        'Healthy Living in a Fast-Paced Society',
        'The Impact of Travel on Personal Growth',
        'Renewable Energy and Environmental Protection',
        'The Psychology of Color in Daily Life',
        'Building Resilience Through Challenges'
      ],
      email: [
        'requesting information about a certification program',
        'applying for a remote work position',
        'following up on a job interview',
        'proposing a new project to your team',
        'asking for feedback on your performance',
        'scheduling a business meeting',
        'introducing yourself to a new client',
        'requesting time off for vacation',
        'inquiring about training opportunities',
        'thanking someone for their mentorship',
        'requesting a recommendation letter',
        'applying for a scholarship program',
        'inquiring about volunteer opportunities',
        'following up on a client proposal',
        'requesting flexible work arrangements',
        'applying for a professional conference',
        'seeking advice from a career counselor',
        'proposing a team building activity',
        'requesting technical support',
        'declining a meeting invitation politely'
      ],
      letter: [
        'to a local newspaper about community issues',
        'of complaint to an online retailer',
        'of recommendation for a student',
        'to a landlord about apartment repairs',
        'applying for membership in a professional organization',
        'to a university admissions office',
        'requesting information about volunteer opportunities',
        'to a government official about policy concerns',
        'thanking someone for their hospitality',
        'to a company inquiring about their products',
        'to a hotel manager about service issues',
        'applying for a library card',
        'to a bank regarding account services',
        'requesting a transcript from your school',
        'to an insurance company about a claim',
        'expressing interest in a rental property',
        'to a utility company about billing',
        'requesting information about local events',
        'to a restaurant owner about catering services',
        'applying for a gym membership'
      ],
      report: [
        'on employee satisfaction survey results',
        'analyzing customer feedback trends',
        'about quarterly sales performance',
        'on workplace safety improvements',
        'evaluating a new software implementation',
        'on market research for a new product',
        'about environmental impact reduction',
        'analyzing social media engagement metrics',
        'on remote work productivity study',
        'evaluating training program effectiveness',
        'on inventory management optimization',
        'analyzing website traffic patterns',
        'about customer service quality assessment',
        'on budget allocation recommendations',
        'evaluating marketing campaign success',
        'on workplace diversity initiatives',
        'analyzing competitor pricing strategies',
        'about technology upgrade proposals',
        'on employee wellness program results',
        'evaluating supplier performance metrics'
      ],
      creative: [
        'about a chance encounter that changed someone\'s life',
        'set in a small town during a festival',
        'about someone learning a new skill later in life',
        'involving a mysterious package delivery',
        'about friends reuniting after many years',
        'set during a power outage in a big city',
        'about overcoming fear of public speaking',
        'involving a community garden project',
        'about a family tradition being passed down',
        'set in a coffee shop on a rainy day',
        'about discovering an old diary in an attic',
        'involving a lost pet finding its way home',
        'about a cooking disaster turned success',
        'set during a snowstorm at a bus station',
        'about learning to drive as an adult',
        'involving neighbors helping each other',
        'about finding an unexpected talent',
        'set in a bookstore after closing time',
        'about a memorable first day at work',
        'involving a time capsule discovery'
      ],
      conversation: [
        'between roommates planning to redecorate their apartment',
        'between coworkers discussing weekend plans',
        'between friends choosing a restaurant for dinner',
        'between family members planning a reunion',
        'between classmates preparing for an exam',
        'between neighbors discussing a local event',
        'between friends debating which movie to watch',
        'between colleagues talking about a new project',
        'between partners planning a weekend trip',
        'between friends sharing recent life updates',
        'between siblings deciding on a gift for parents',
        'between teammates celebrating a victory',
        'between students discussing a group project',
        'between friends planning a surprise party',
        'between coworkers sharing lunch recommendations',
        'between neighbors organizing a block party',
        'between friends discussing book recommendations',
        'between classmates comparing study methods',
        'between family members cooking together',
        'between friends planning a hiking trip'
      ]
    };

    // Additional randomization elements for more variety
    const writingStyles = [
      'descriptive and detailed',
      'concise and direct',
      'conversational and friendly',
      'formal and professional',
      'engaging and storytelling',
      'analytical and logical',
      'persuasive and compelling',
      'informative and educational'
    ];

    const perspectives = [
      'first person experience',
      'objective third person view',
      'personal reflection style',
      'advisory tone',
      'explanatory approach',
      'comparative analysis',
      'problem-solution format',
      'narrative storytelling'
    ];

    const contexts = [
      'modern workplace setting',
      'academic environment',
      'everyday life situation',
      'professional development context',
      'personal growth journey',
      'community involvement',
      'international perspective',
      'local community focus',
      'technological advancement theme',
      'environmental consciousness angle'
    ];

    const creativeElements = [
      'include specific examples',
      'add personal anecdotes',
      'incorporate statistics or facts',
      'use metaphors or analogies',
      'include dialogue or quotes',
      'add sensory descriptions',
      'incorporate cause and effect',
      'use comparison and contrast'
    ];

    // Randomly select elements for variety
    const topics = randomTopics[type as keyof typeof randomTopics] || ['a general topic'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const randomStyle = writingStyles[Math.floor(Math.random() * writingStyles.length)];
    const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
    const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
    const randomElement = creativeElements[Math.floor(Math.random() * creativeElements.length)];
    
    // Random time variations for emails and letters
    const timeVariations = [
      'morning business hours',
      'end of business day',
      'beginning of the week',
      'end of the week',
      'urgent timing',
      'follow-up after some time',
      'seasonal context',
      'project deadline approach'
    ];
    const randomTiming = timeVariations[Math.floor(Math.random() * timeVariations.length)];

    // Random names and locations for personalization
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River'];
    const companies = ['TechCorp', 'Global Solutions', 'Innovative Systems', 'Future Dynamics', 'Creative Ventures', 'Digital Horizons'];
    const cities = ['downtown', 'the suburbs', 'a coastal city', 'a mountain town', 'an urban center', 'a university town'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomLocation = cities[Math.floor(Math.random() * cities.length)];

    const wordCount = level === 'beginner' ? '150-250' : level === 'intermediate' ? '250-400' : '400-600';
    const complexity = level === 'beginner' ? 
      'Use simple sentences and basic vocabulary. Avoid complex grammar structures. Make it easy to read and understand.' : 
      level === 'intermediate' ? 
      'Use some complex sentences and academic vocabulary. Include varied sentence structures. Balance simple and sophisticated language.' : 
      'Use advanced vocabulary, complex sentence structures, and sophisticated arguments. Demonstrate mastery of English with nuanced expression.';

    // Add unique timestamp to ensure different responses
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    
    switch (type) {
      case 'essay':
        return `Create a unique ${wordCount} word academic essay for ${level}-level ESL students on: "${randomTopic}". 
        
        Style: Write in a ${randomStyle} manner with a ${randomPerspective}. 
        Context: Set this in a ${randomContext}.
        Approach: ${randomElement} to make it engaging.
        
        ${complexity} 
        
        Structure: Include an introduction with a clear thesis, 2-3 body paragraphs with supporting evidence, and a strong conclusion.
        
        Make this essay unique and different from typical examples. Seed: ${timestamp}${randomSeed}`;
      
      case 'email':
        return `Create a professional email for ${level}-level ESL students ${randomTopic}. 
        
        Context: This is being sent during ${randomTiming} in a ${randomContext}.
        Sender: ${randomName} from ${randomCompany}
        Style: Write in a ${randomStyle} tone with ${randomPerspective}.
        
        ${complexity} 
        
        Include: Proper email formatting with subject line, greeting, clear purpose, detailed body, and professional closing.
        Special element: ${randomElement}.
        
        Make this email scenario realistic and unique. Seed: ${timestamp}${randomSeed}`;
      
      case 'letter':
        return `Create a formal letter for ${level}-level ESL students ${randomTopic}. 
        
        Setting: Written from ${randomLocation} during ${randomTiming}.
        Writer: ${randomName} 
        Style: ${randomStyle} approach with ${randomPerspective}.
        
        ${complexity} 
        
        Format: Include proper letter formatting with date, addresses, formal greeting, structured body paragraphs, and appropriate closing.
        Focus: ${randomElement} to strengthen the message.
        
        Create a unique and realistic letter scenario. Seed: ${timestamp}${randomSeed}`;
      
      case 'report':
        return `Create a business report for ${level}-level ESL students ${randomTopic}. 
        
        Company: ${randomCompany} in ${randomLocation}
        Author: ${randomName}
        Style: ${randomStyle} presentation with ${randomPerspective}.
        Context: ${randomContext}
        
        ${complexity} 
        
        Structure: Executive summary, methodology, key findings, analysis, and clear recommendations.
        Special focus: ${randomElement} throughout the report.
        
        Make this report scenario unique and professionally realistic. Seed: ${timestamp}${randomSeed}`;
      
      case 'creative':
        return `Create a creative short story for ${level}-level ESL students ${randomTopic}. 
        
        Setting: ${randomLocation} during ${randomTiming}
        Main character: ${randomName}
        Style: ${randomStyle} narrative with ${randomPerspective}
        
        ${complexity} 
        
        Elements: Strong character development, vivid setting descriptions, engaging dialogue, and a satisfying resolution.
        Creative technique: ${randomElement} to enhance the storytelling.
        
        Make this story unique, engaging, and memorable. Seed: ${timestamp}${randomSeed}`;
      
      case 'conversation':
        return `Create a realistic conversation for ${level}-level ESL students ${randomTopic}. 
        
        Participants: Include ${randomName} and others
        Setting: ${randomLocation} during ${randomTiming}
        Tone: ${randomStyle} and ${randomPerspective}
        
        ${complexity} 
        
        Style: Natural dialogue with appropriate informal language, interruptions, and realistic speech patterns.
        Include: ${randomElement} to make the conversation more authentic.
        
        Create a unique, realistic conversation that flows naturally. Seed: ${timestamp}${randomSeed}`;
      
      default:
        return `Create a unique sample ${type} for ${level}-level ESL students on ${randomTopic}. 
        
        Author: ${randomName}
        Style: ${randomStyle} with ${randomPerspective}
        Context: ${randomContext}
        
        ${complexity} 
        
        Special element: ${randomElement}
        
        Make this completely unique and engaging. Seed: ${timestamp}${randomSeed}`;
    }
  };

  // const _getMockContent = (_type: string, _level: DifficultyLevel): string => {
  //   const mockContent = {
  //     essay: {
  //       beginner: "Education is very important in our lives...",
  //       intermediate: "Education plays a crucial role...",
  //       advanced: "The significance of education transcends..."
  //     },
  //     email: {
  //       beginner: "Subject: Question about English Course...",
  //       intermediate: "Subject: Application for Marketing Internship...",
  //       advanced: "Subject: Strategic Partnership Proposal..."
  //     }
  //   };
  //   return mockContent[_type as keyof typeof mockContent]?.[_level] || 
  //          "Sample content will be generated here.";
  // };

  const getRandomMockContent = (type: string, level: DifficultyLevel): string => {
    // Varied mock content to avoid repetition
    const randomMockContent = {
      essay: {
        beginner: [
          "City life can be exciting and challenging. Many people move to big cities for better jobs and opportunities. In the city, there are tall buildings, busy streets, and lots of people everywhere. You can find good restaurants, shopping centers, and entertainment. However, city life can also be stressful and expensive. The air is sometimes polluted, and everything moves very fast. Despite these problems, many people prefer city life because it offers more chances to succeed.",
          "Learning to cook changed my life in many ways. At first, I was afraid to use the kitchen. I could only make simple things like sandwiches and instant noodles. Then I started watching cooking videos online and practicing basic recipes. Now I can make delicious meals for my family and friends. Cooking helps me save money and eat healthier food. It also makes me feel proud when people enjoy my cooking.",
          "Pets bring joy and happiness to our homes. Dogs are loyal friends who love to play and protect their families. Cats are independent but also very loving companions. Taking care of a pet teaches responsibility and patience. Pets help reduce stress and make us feel less lonely. However, having a pet requires time, money, and commitment. You must feed them, take them to the vet, and give them attention every day."
        ],
        intermediate: [
          "The digital revolution has fundamentally transformed how we communicate and access information. Social media platforms have connected people across continents, enabling instant communication and global awareness. However, this technological advancement has also created new challenges, including privacy concerns and the spread of misinformation. As we navigate this digital landscape, it becomes crucial to develop digital literacy skills and maintain a balance between online and offline interactions.",
          "Sustainable transportation is becoming increasingly important in addressing climate change and urban pollution. Electric vehicles, public transit systems, and cycling infrastructure represent viable alternatives to traditional fossil fuel-dependent transportation. Cities worldwide are implementing innovative solutions such as bike-sharing programs and electric bus fleets. While these initiatives require significant investment, they offer long-term benefits for environmental health and quality of life.",
          "Remote work has redefined the traditional workplace, offering flexibility and work-life balance to millions of employees. This shift has enabled companies to access global talent while reducing overhead costs. However, remote work also presents challenges in team collaboration, employee engagement, and maintaining company culture. Successful remote work requires strong communication skills, self-discipline, and effective use of digital tools."
        ],
        advanced: [
          "The intersection of artificial intelligence and healthcare represents one of the most promising frontiers in modern medicine. Machine learning algorithms are revolutionizing diagnostic accuracy, enabling early detection of diseases through pattern recognition in medical imaging and genetic data. Furthermore, AI-powered drug discovery platforms are accelerating the development of targeted therapies, potentially reducing the time and cost associated with bringing new medications to market. However, the integration of AI in healthcare raises important ethical considerations regarding data privacy, algorithmic bias, and the preservation of human judgment in clinical decision-making.",
          "Contemporary urban planning faces the complex challenge of creating sustainable, inclusive cities that can accommodate rapid population growth while minimizing environmental impact. Smart city initiatives leverage Internet of Things (IoT) technology, data analytics, and renewable energy systems to optimize resource consumption and improve quality of life. However, the implementation of these technologies must be carefully balanced with considerations of digital equity, ensuring that all residents have access to the benefits of urban innovation regardless of their socioeconomic status.",
          "The global transition toward renewable energy sources represents a critical paradigm shift in addressing climate change and achieving energy security. Solar and wind technologies have achieved cost parity with fossil fuels in many markets, driving unprecedented investment in clean energy infrastructure. However, the intermittent nature of renewable sources necessitates advances in energy storage technologies and grid modernization. Policy frameworks must evolve to support this transition while ensuring energy accessibility and economic stability for communities dependent on traditional energy sectors."
        ]
      },
      email: {
        beginner: [
          "Subject: Asking About Cooking Class\n\nDear Ms. Chen,\n\nI hope you are well. I saw your cooking class advertisement at the community center. I am very interested in learning how to cook healthy meals.\n\nCould you please tell me when the classes start? Also, what is the cost for one month?\n\nI am a complete beginner, so I hope that is okay.\n\nThank you for your help.\n\nBest regards,\nMaria Santos",
          "Subject: Library Card Application\n\nDear Library Staff,\n\nI am new to this city and would like to get a library card. I enjoy reading books and would love to use your services.\n\nWhat documents do I need to bring? Are there any fees?\n\nAlso, do you have books in Spanish? I am still learning English.\n\nThank you for your time.\n\nSincerely,\nCarlos Rodriguez",
          "Subject: Gym Membership Question\n\nHello,\n\nI am interested in joining your gym. I want to start exercising regularly to stay healthy.\n\nCan you please send me information about membership prices and available classes?\n\nI am especially interested in swimming and yoga.\n\nThank you very much.\n\nBest wishes,\nAisha Ahmed"
        ],
        intermediate: [
          "Subject: Application for Volunteer Position - Environmental Cleanup\n\nDear Environmental Action Team,\n\nI am writing to express my interest in volunteering for your upcoming coastal cleanup initiative. As an environmental science student, I am passionate about conservation efforts and would like to contribute to your organization's mission.\n\nI have previous experience organizing community events and am comfortable working in outdoor environments. Additionally, I speak both English and Spanish, which could be helpful for communicating with diverse volunteer groups.\n\nI am available on weekends and would appreciate the opportunity to discuss how I can best contribute to your team.\n\nThank you for considering my application.\n\nBest regards,\nAlex Chen",
          "Subject: Request for Professional Development Workshop\n\nDear Training Department,\n\nI hope this message finds you well. I would like to request approval to attend the Advanced Data Analysis Workshop scheduled for next month at the Convention Center.\n\nThis workshop directly relates to my current project responsibilities and would enhance my ability to generate insights from our customer database. The skills learned would benefit not only my individual performance but also support our team's quarterly objectives.\n\nThe total cost is $450, including materials and lunch. I have attached the detailed agenda for your review.\n\nI would be happy to share key learnings with the team upon my return.\n\nThank you for your consideration.\n\nSincerely,\nJordan Taylor"
        ],
        advanced: [
          "Subject: Strategic Partnership Proposal - Sustainable Technology Initiative\n\nDear Dr. Richardson,\n\nI trust this message finds you in good health and high spirits. I am reaching out to propose a collaborative research initiative between our institutions that could yield significant advancements in sustainable technology development.\n\nOur recent breakthrough in bio-based materials has opened new possibilities for environmentally conscious manufacturing processes. Given your team's expertise in industrial automation, I believe a partnership could accelerate the commercial viability of these innovations while addressing pressing environmental challenges.\n\nI would welcome the opportunity to present our preliminary findings and explore potential synergies during a formal meeting. Our research team is prepared to discuss intellectual property frameworks, funding mechanisms, and projected timelines for collaborative projects.\n\nPlease let me know your availability for the coming weeks. I am confident that this partnership could establish both our institutions as leaders in sustainable technology innovation.\n\nLooking forward to your response.\n\nWarm regards,\nDr. Patricia Williams",
          "Subject: Investment Proposal - Emerging Markets Healthcare Technology\n\nDear Investment Committee,\n\nI am pleased to present an exceptional investment opportunity in the healthcare technology sector, specifically targeting underserved emerging markets. Our due diligence has identified a portfolio company with proprietary telemedicine platforms that have demonstrated remarkable scalability and social impact.\n\nThe company's innovative approach to remote diagnostics has already improved healthcare access for over 50,000 patients in rural communities across three countries. Their technology stack includes AI-powered symptom assessment, secure patient data management, and integration capabilities with existing healthcare infrastructure.\n\nFinancial projections indicate a potential 300% return on investment within five years, while the social impact metrics demonstrate measurable improvements in healthcare outcomes. The management team combines deep technical expertise with proven track records in emerging market expansion.\n\nI have prepared a comprehensive investment memorandum detailing market analysis, competitive positioning, and risk assessment. I would appreciate the opportunity to present these findings at your earliest convenience.\n\nThank you for your time and consideration.\n\nRespectfully yours,\nMichael Foster"
        ]
      }
    };

    const contentArray = randomMockContent[type as keyof typeof randomMockContent]?.[level];
    if (contentArray && Array.isArray(contentArray)) {
      return contentArray[Math.floor(Math.random() * contentArray.length)];
    }
    
    return "Sample content will be generated here. Click the generate button to create new content.";
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  // const insertContent = () => {
  //   if (onSampleSelect && generatedContent) {
  //     onSampleSelect(generatedContent);
  //   }
  // };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm flex items-center">
          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
          Sample {writingType === 'conversation' ? 'Text' : writingType === 'essay' ? 'Essay' : writingType === 'email' ? 'Email' : writingType === 'letter' ? 'Letter' : writingType === 'report' ? 'Report' : 'Content'} Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {/* Professional Difficulty Level Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Select Difficulty Level</label>
          <div className="relative dropdown-container">
            {/* Enhanced Dropdown Trigger */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  selectedLevel === 'beginner' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  selectedLevel === 'intermediate' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                  'bg-gradient-to-r from-purple-400 to-purple-500'
                }`}></div>
                <span className="font-semibold text-gray-900">{difficultyLevels.find(l => l.value === selectedLevel)?.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selectedLevel === 'beginner' ? 'bg-green-100 text-green-700' :
                  selectedLevel === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {difficultyLevels.find(l => l.value === selectedLevel)?.wordRange}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Enhanced Dropdown Content */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm">
                {difficultyLevels.map((level, index) => (
                  <button
                    key={level.value}
                    onClick={() => {
                      setSelectedLevel(level.value);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left hover:bg-gradient-to-r transition-all duration-200 ease-in-out ${
                      level.value === 'beginner' ? 'hover:from-green-50 hover:to-green-100' :
                      level.value === 'intermediate' ? 'hover:from-blue-50 hover:to-blue-100' :
                      'hover:from-purple-50 hover:to-purple-100'
                    } ${index === 0 ? 'rounded-t-xl' : ''} ${index === difficultyLevels.length - 1 ? 'rounded-b-xl' : ''}`}
                  >
                    <div className={`p-4 ${
                      selectedLevel === level.value 
                        ? `border-l-4 ${
                            level.value === 'beginner' ? 'border-green-500 bg-green-50' :
                            level.value === 'intermediate' ? 'border-blue-500 bg-blue-50' :
                            'border-purple-500 bg-purple-50'
                          }` 
                        : 'border-l-4 border-transparent'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            level.value === 'beginner' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            level.value === 'intermediate' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            'bg-gradient-to-r from-purple-400 to-purple-500'
                          }`}></div>
                          <span className="font-semibold text-sm text-gray-900">{level.label}</span>
                          {selectedLevel === level.value && (
                            <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium shadow-sm ${
                          level.value === 'beginner' ? 'bg-green-100 text-green-700 border border-green-200' :
                          level.value === 'intermediate' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          {level.wordRange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{level.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateSampleContent}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Sample
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Professional Generated Content Display */}
        {generatedContent && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 flex items-center">
                <BookOpen className="h-4 w-4 mr-1.5 text-blue-500" />
                Generated Sample
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedLevel === 'beginner' ? 'bg-green-100 text-green-700' :
                selectedLevel === 'intermediate' ? 'bg-blue-100 text-blue-700' : 
                'bg-purple-100 text-purple-700'
              }`}>
                {difficultyLevels.find(l => l.value === selectedLevel)?.label}
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="text-sm leading-relaxed text-gray-800 font-medium">
                {generatedContent.split('\n').map((line, index) => (
                  <div key={index} className={line.trim() === '' ? 'mb-3' : 'mb-1'}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Professional Action Button */}
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="w-full text-sm font-medium border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SampleContentGenerator; 