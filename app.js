/* ========================================
   Application Logic
   ======================================== */

// Supabase Configuration for User Data Sync
const SUPABASE_URL = 'https://rpqvpedrmalgdwzpshgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcXZwZWRybWFsZ2R3enBzaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTU4MzAsImV4cCI6MjA4NDMzMTgzMH0.dArSCArtyiG8soYDzv8mjHFaVWd1jovuJKYrv4AreLk';

let supabaseClient = null;
let currentUserId = null;

// Initialize Supabase client (reuse existing or create new)
async function initSupabaseClient() {
    if (typeof window.supabase === 'undefined') {
        console.log('Supabase SDK not loaded');
        return null;
    }

    // Reuse existing client if available, otherwise create new
    if (window.supabaseClient) {
        supabaseClient = window.supabaseClient;
    } else {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
    }

    // Check if user is logged in
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        currentUserId = session.user.id;
    }

    // Listen for auth state changes - reload page to refresh data
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const newUserId = session?.user?.id || null;

        // If user changed (login/logout/switch account), clear localStorage and reload
        if (newUserId !== currentUserId) {
            console.log('Auth state changed, clearing localStorage and reloading...');
            // Clear user-specific data from localStorage to prevent cross-account leakage
            localStorage.removeItem('reading-list');
            localStorage.removeItem('roadmap-progress');
            window.location.reload();
        }
    });

    return supabaseClient;
}

// Load user data from Supabase or localStorage
async function loadUserData(dataType, defaultValue) {
    // If logged in, ONLY load from Supabase (never localStorage to ensure account isolation)
    if (currentUserId && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('user_data')
                .select('data')
                .eq('user_id', currentUserId)
                .eq('data_type', dataType)
                .maybeSingle();

            if (error) {
                console.log('Supabase query error:', error.code, error.message);
                // Return default, NOT localStorage (account isolation)
                return defaultValue;
            }

            if (data) {
                return data.data;
            }

            // No cloud data for this user - return default
            return defaultValue;
        } catch (err) {
            console.log('Supabase load error:', err);
            // Return default, NOT localStorage (account isolation)
            return defaultValue;
        }
    }

    // Only use localStorage when NOT logged in
    return JSON.parse(localStorage.getItem(dataType)) || defaultValue;
}

// Save user data to Supabase and localStorage
async function saveUserData(dataType, data) {
    // Always save to localStorage as backup
    localStorage.setItem(dataType, JSON.stringify(data));

    // If logged in, also save to Supabase
    if (currentUserId && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('user_data')
                .upsert({
                    user_id: currentUserId,
                    data_type: dataType,
                    data: data,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,data_type'
                });

            if (error) {
                console.error('Supabase save error:', error);
            }
        } catch (err) {
            console.error('Supabase save failed:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase first
    await initSupabaseClient();

    initNavigation();
    initCalculator();
    initPlayground();
    initPrdGenerator();
    initRoadmap();
    initReadingList();
    initQuiz();
    initCustomSelects();
    initNewsSection();
    initThemeToggle();
});

/* ========================================
   File Upload Utilities
   ======================================== */
// Vision model identifiers
const VISION_MODELS = ['glm-4v', 'qwen3-vl'];

function isVisionModel(modelKey) {
    return VISION_MODELS.includes(modelKey);
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Setup drop zone for file upload
function setupDropZone(dropZoneId, fileInputId, previewId, onFileSelected) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);

    if (!dropZone || !fileInput || !preview) return null;

    let currentFile = null;
    let currentBase64 = null;

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await handleFile(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            await handleFile(e.target.files[0]);
        }
    });

    async function handleFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件 (JPG, PNG, GIF)');
            return;
        }

        // Validate file size (max 4MB)
        if (file.size > 4 * 1024 * 1024) {
            alert('图片大小不能超过4MB');
            return;
        }

        currentFile = file;
        currentBase64 = await fileToBase64(file);

        // Show preview
        const sizeKB = (file.size / 1024).toFixed(1);
        preview.innerHTML = `
            <img src="${currentBase64}" alt="Preview">
            <button class="remove-image" onclick="this.parentElement.innerHTML=''; this.parentElement.classList.add('hidden');">×</button>
            <div class="image-info">${file.name} (${sizeKB} KB)</div>
        `;
        preview.classList.remove('hidden');

        // Add click handler to remove button to also clear the data
        preview.querySelector('.remove-image').addEventListener('click', () => {
            currentFile = null;
            currentBase64 = null;
            fileInput.value = '';
            if (onFileSelected) onFileSelected(null);
        });

        if (onFileSelected) onFileSelected(currentBase64);
    }

    function clearPreview() {
        preview.innerHTML = '';
        preview.classList.add('hidden');
        currentFile = null;
        currentBase64 = null;
        fileInput.value = '';
    }

    return {
        getFile: () => currentFile,
        getBase64: () => currentBase64,
        clear: clearPreview
    };
}

// Build messages array with image for vision models
function buildVisionMessages(prompt, imageBase64, systemPrompt = null) {
    const messages = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    if (imageBase64) {
        // Vision model format with image
        messages.push({
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: { url: imageBase64 }
                },
                {
                    type: 'text',
                    text: prompt
                }
            ]
        });
    } else {
        messages.push({ role: 'user', content: prompt });
    }

    return messages;
}

/* ========================================
   1. Navigation System
   ======================================== */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const featureCards = document.querySelectorAll('.feature-card');

    function setActiveSection(sectionId) {
        // Update Nav
        navLinks.forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update Sections
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Scroll to top
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            setActiveSection(sectionId);
        });
    });

    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const sectionId = card.dataset.navigate;
            setActiveSection(sectionId);
        });
    });
}

/* ========================================
   2. AI Cost Calculator
   ======================================== */
function initCalculator() {
    const inputs = {
        dau: document.getElementById('calc-dau'),
        conversations: document.getElementById('calc-conversations'),
        inputTokens: document.getElementById('calc-input-tokens'),
        outputTokens: document.getElementById('calc-output-tokens'),
        model: document.getElementById('calc-model'),
        subscription: document.getElementById('calc-subscription')
    };

    const results = {
        dailyTokens: document.getElementById('result-daily-tokens'),
        dailyCost: document.getElementById('result-daily-cost'),
        monthlyCost: document.getElementById('result-monthly-cost'),
        breakeven: document.getElementById('result-breakeven'),
        container: document.getElementById('calc-results'),
        breakevenContainer: document.getElementById('breakeven-result')
    };

    // Model Pricing (Approximate per 1M tokens)
    // Mixed Input/Output average for simplicity or split if needed
    // Here we use a weighted average or simple calculation for prototype
    const modelPricing = {
        'llama-8b': { input: 0.1, output: 0.1 },
        'llama-70b': { input: 0.8, output: 0.8 },
        'qwen-7b': { input: 0.15, output: 0.15 },
        'glm-9b': { input: 0.2, output: 0.2 },
        'mistral-7b': { input: 0.12, output: 0.12 }
    };

    document.getElementById('calc-compute').addEventListener('click', computeCosts);
    document.getElementById('calc-breakeven').addEventListener('click', computeBreakEven);

    function computeCosts() {
        const dau = parseInt(inputs.dau.value) || 0;
        const convs = parseInt(inputs.conversations.value) || 0;
        const inTok = parseInt(inputs.inputTokens.value) || 0;
        const outTok = parseInt(inputs.outputTokens.value) || 0;
        const modelKey = inputs.model.value;
        const prices = modelPricing[modelKey];

        // Calculations
        const dailyConversations = dau * convs;
        const dailyInputTokens = dailyConversations * inTok;
        const dailyOutputTokens = dailyConversations * outTok;
        const totalDailyTokens = dailyInputTokens + dailyOutputTokens;

        // Cost = (Tokens / 1,000,000) * Price
        const dailyCostInput = (dailyInputTokens / 1000000) * prices.input;
        const dailyCostOutput = (dailyOutputTokens / 1000000) * prices.output;
        const totalDailyCost = dailyCostInput + dailyCostOutput;
        const totalMonthlyCost = totalDailyCost * 30;

        // Display
        results.dailyTokens.textContent = formatNumber(totalDailyTokens);
        results.dailyCost.textContent = formatCurrency(totalDailyCost);
        results.monthlyCost.textContent = formatCurrency(totalMonthlyCost);
        results.container.classList.remove('hidden');
        results.container.classList.add('active'); // Ensure animation can play if added
    }

    function computeBreakEven() {
        // Need to ensure base costs are computed first
        computeCosts();

        const dau = parseInt(inputs.dau.value) || 1;
        const subscriptionPrice = parseFloat(inputs.subscription.value) || 0;

        // Get Monthly Cost from previous calculation logic
        // We recalculate per-user cost
        const totalMonthlyCostStr = results.monthlyCost.textContent.replace('$', '').replace(',', '');
        const totalMonthlyCost = parseFloat(totalMonthlyCostStr);

        const costPerUser = totalMonthlyCost / dau;

        if (subscriptionPrice <= costPerUser) {
            results.breakeven.textContent = "无法盈利 (成本 > 订阅费)";
            results.breakeven.style.color = "var(--accent)";
        } else {
            // Break even point (Users) -> Fixed costs here are 0 for this simple calc, 
            // so we calculate when (Margin * Users) covers... wait, 
            // Usually Break Even = Fixed Cost / (Price - Variable Cost).
            // In this strict API cost context, "Break Even" implies where we stop losing money per user?
            // Or maybe the user means "How many users do I need to pay for a fixed server cost?"
            // BUT, the prompt asked: "输入订阅费...计算盈亏平衡点".
            // If costs are purely variable (API), then as long as Sub > API Cost per user, every user is profitable.
            // Let's assume there's a baseline fixed cost implicitly or just show margin.

            // LET'S INTERPRET "Break Even" as requested in prompt: 
            // "Calculates break-even point" often implies covering SOME fixed investment.
            // Since we don't have fixed investment input, let's assume the user implies:
            // "At what point does my revenue cover my API bill?" -> That's always true if Rev > Cost/User.

            // ALTERNATIVE INTERPRETATION: Maybe the user implicitly has development costs?
            // Let's stick to the prompt's implied simple logic or add a dummy fixed cost.

            // Let's calculate: Monthly Revenue vs Monthly Cost
            const profitPerUser = subscriptionPrice - costPerUser;
            const margin = (profitPerUser / subscriptionPrice) * 100;

            results.breakeven.textContent = `每用户盈利 $${profitPerUser.toFixed(2)} (毛利 ${margin.toFixed(0)}%)`;
            results.breakeven.style.color = "var(--primary-light)";
        }

        results.breakevenContainer.classList.remove('hidden');
    }

    function formatNumber(num) {
        return num.toLocaleString('en-US');
    }

    function formatCurrency(num) {
        return '$' + num.toFixed(2);
    }
}

/* ========================================
   3. Parameter Playground (Real API)
   ======================================== */
function initPlayground() {
    const sliders = {
        temp: document.getElementById('temp-slider'),
        topp: document.getElementById('topp-slider'),
        tokens: document.getElementById('tokens-slider')
    };

    const displays = {
        temp: document.getElementById('temp-value'),
        topp: document.getElementById('topp-value'),
        tokens: document.getElementById('tokens-value')
    };

    const generateBtn = document.getElementById('playground-generate');
    const clearBtn = document.getElementById('playground-clear');
    const outputBox = document.getElementById('playground-output');
    const tokenCount = document.getElementById('token-count');
    const promptInput = document.getElementById('playground-prompt');
    const modelSelect = document.getElementById('playground-model');
    const modelBadge = document.getElementById('current-model-badge');
    const responseTime = document.getElementById('response-time');

    // Model display names
    const modelNames = {
        'deepseek-v3': 'DeepSeek-V3.2',
        'glm-4v': 'GLM-4.6V',
        'qwen3-vl': 'Qwen3-VL-32B',
        'qwen-7b': 'Qwen2.5-7B'
    };

    // Upload section elements
    const uploadSection = document.getElementById('playground-upload-section');
    let playgroundUploader = null;
    let currentImageBase64 = null;

    // Setup file uploader
    playgroundUploader = setupDropZone(
        'playground-drop-zone',
        'playground-file-input',
        'playground-image-preview',
        (base64) => { currentImageBase64 = base64; }
    );

    // Update model badge and show/hide upload section
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            const model = e.target.value;
            if (modelBadge) {
                modelBadge.textContent = modelNames[model] || model;
            }
            // Show upload section only for vision models
            if (uploadSection) {
                uploadSection.style.display = isVisionModel(model) ? 'block' : 'none';
            }
        });
    }

    // Update displays on slide
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', (e) => {
            displays[key].textContent = e.target.value;
        });
    });

    clearBtn.addEventListener('click', () => {
        outputBox.innerHTML = '点击"生成输出"按钮查看AI响应...';
        tokenCount.textContent = '0';
        if (responseTime) responseTime.textContent = '0';
    });

    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        const temp = parseFloat(sliders.temp.value);
        const topP = parseFloat(sliders.topp.value);
        const maxTokens = parseInt(sliders.tokens.value);
        const selectedModel = modelSelect ? modelSelect.value : 'deepseek-v3';

        if (!prompt) return;

        displayLoading();
        generateBtn.disabled = true;
        generateBtn.innerHTML = '生成中...';
        const startTime = Date.now();

        try {
            let fullResponse = '';
            let currentTokens = 0;

            // Build messages with image support for vision models
            const messages = buildVisionMessages(prompt, currentImageBase64);

            // Use streaming API with selected model
            await callSiliconFlowAPI({
                model: selectedModel,
                messages: messages,
                temperature: temp,
                top_p: topP,
                max_tokens: maxTokens,
                stream: true,
                onChunk: (chunk) => {
                    fullResponse += chunk;
                    outputBox.innerHTML = fullResponse.replace(/\n/g, '<br>');
                    currentTokens++;
                    tokenCount.textContent = currentTokens;
                    outputBox.scrollTop = outputBox.scrollHeight;

                    // Update response time
                    if (responseTime) {
                        responseTime.textContent = ((Date.now() - startTime) / 1000).toFixed(1);
                    }
                }
            });

        } catch (error) {
            outputBox.innerHTML = `<div style="color: var(--accent);">
                <strong>错误:</strong> ${error.message}<br><br>
                请检查网络连接或稍后重试。
            </div>`;
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '生成输出';
            if (responseTime) {
                responseTime.textContent = ((Date.now() - startTime) / 1000).toFixed(1);
            }
        }
    });

    function displayLoading() {
        outputBox.innerHTML = '<div class="loading"></div> <span style="color: var(--text-muted);">正在思考中...</span>';
        tokenCount.textContent = '0';
        if (responseTime) responseTime.textContent = '0';
    }
}

/* ========================================
   4. AI PRD Generator (Real API)
   ======================================== */
function initPrdGenerator() {
    const generateBtn = document.getElementById('prd-generate');
    const copyBtn = document.getElementById('prd-copy');
    const input = document.getElementById('prd-input');
    const outputContainer = document.getElementById('prd-output');
    const contentBox = document.getElementById('prd-content');
    const modelSelect = document.getElementById('prd-model');

    // Upload section elements
    const uploadSection = document.getElementById('prd-upload-section');
    let prdUploader = null;
    let prdImageBase64 = null;

    // Setup file uploader for PRD
    prdUploader = setupDropZone(
        'prd-drop-zone',
        'prd-file-input',
        'prd-image-preview',
        (base64) => { prdImageBase64 = base64; }
    );

    // Show/hide upload section based on model selection
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            if (uploadSection) {
                uploadSection.style.display = isVisionModel(e.target.value) ? 'block' : 'none';
            }
        });
    }

    const SYSTEM_PROMPT = `你是一位资深AI产品经理导师。基于用户的一句话需求生成专业PRD文档，包含：用户画像(含痛点)、核心功能列表(带P0/P1优先级)、数据埋点建议。如果提供了产品截图或原型图，请结合图片内容进行分析。输出Markdown格式。`;

    generateBtn.addEventListener('click', async () => {
        const userInput = input.value.trim();
        if (!userInput) return;

        const selectedModel = modelSelect ? modelSelect.value : 'deepseek-v3';
        generateBtn.innerHTML = '<span class="loading" style="width:15px;height:15px;"></span> 生成中...';
        generateBtn.disabled = true;
        contentBox.innerHTML = '<div class="loading"></div> <span style="color:var(--text-muted);">正在生成PRD文档...</span>';
        outputContainer.classList.remove('hidden');

        try {
            // Build messages with image support
            const userMessage = `请为以下产品想法生成专业PRD文档：\n\n${userInput}`;
            const messages = buildVisionMessages(userMessage, prdImageBase64, SYSTEM_PROMPT);

            const response = await callSiliconFlowAPI({
                model: selectedModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2500
            });
            renderPRD(extractContent(response));
        } catch (error) {
            contentBox.innerHTML = `<div style="color:var(--accent);padding:20px;"><strong>生成失败:</strong> ${error.message}<br><br>请检查网络连接后重试。</div>`;
        } finally {
            generateBtn.innerHTML = '生成PRD';
            generateBtn.disabled = false;
        }
    });

    copyBtn.addEventListener('click', () => {
        const text = contentBox.innerText;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerText = '已复制!';
            setTimeout(() => { copyBtn.innerText = '复制全文'; }, 2000);
        });
    });



    function renderPRD(markdown) {
        // Use marked.js for rendering
        const html = marked.parse(markdown);
        contentBox.innerHTML = html;

        // Ensure links open in new tab
        contentBox.querySelectorAll('a').forEach(link => {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        });
    }
}

/* ========================================
   5. Interactive Roadmap
   ======================================== */
async function initRoadmap() {
    // Data definition for checkpoints using structured resource links
    const checkpointData = {
        '1-1': {
            title: '理解LLM的工作原理',
            description: '了解大语言模型背后的核心机制，从Transformer到Token预测。',
            resources: [
                {
                    type: 'video',
                    title: 'Deep Dive into LLMs like ChatGPT',
                    author: 'Andrej Karpathy',
                    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
                    duration: '1h 00m'
                },
                {
                    type: 'article',
                    title: 'The Illustrated Transformer',
                    author: 'Jay Alammar',
                    url: 'http://jalammar.github.io/illustrated-transformer/',
                    readTime: '15 min'
                },
                {
                    type: 'video',
                    title: 'Large Language Models Explained briefly',
                    author: 'Google Cloud Tech',
                    url: 'https://www.youtube.com/watch?v=5sLYAQS9sWQ',
                    duration: '5 min'
                }
            ]
        },
        '1-2': {
            title: '掌握Prompt Engineering核心技巧',
            description: '学习如何像编程一样编写提示词，解锁模型的最大潜力。',
            resources: [
                {
                    type: 'guide',
                    title: 'Prompt Engineering Guide',
                    author: 'DAIR.AI',
                    url: 'https://www.promptingguide.ai/',
                    readTime: 'Comprehensive'
                },
                {
                    type: 'video',
                    title: 'ChatGPT Prompt Engineering for Developers',
                    author: 'Andrew Ng & OpenAI',
                    url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/',
                    duration: 'Course'
                },
                {
                    type: 'article',
                    title: 'Brex\'s Prompt Engineering Guide',
                    author: 'Brex',
                    url: 'https://github.com/brexhq/prompt-engineering',
                    readTime: '20 min'
                }
            ]
        },
        '1-3': {
            title: '学会API调用与成本估算',
            description: '掌握API集成实战技能与商业成本控制模型。',
            resources: [
                {
                    type: 'doc',
                    title: 'OpenAI API Documentation',
                    author: 'OpenAI',
                    url: 'https://platform.openai.com/docs/introduction',
                    readTime: 'Ref'
                },
                {
                    type: 'tool',
                    title: 'LLM Price Comparison',
                    author: 'Artificial Analysis',
                    url: 'https://artificialanalysis.ai/models',
                    readTime: 'Tool'
                }
            ]
        },
        '2-1': {
            title: '集成主流LLM API',
            description: '实战接入OpenAI, Gemini, DeepSeek等主流模型接口。',
            resources: [
                {
                    type: 'guide',
                    title: 'OpenAI Python Library Guide',
                    author: 'OpenAI',
                    url: 'https://github.com/openai/openai-python',
                    readTime: '10 min'
                },
                {
                    type: 'article',
                    title: 'How to build an AI App with LangChain',
                    author: 'Streamlit',
                    url: 'https://blog.streamlit.io/langchain-tutorial-1-build-an-llm-powered-app-in-18-lines-of-code/',
                    readTime: '15 min'
                }
            ]
        },
        '2-2': {
            title: '实现Token计数与成本监控',
            description: '精准计算Token消耗，构建完善的用量监控体系。',
            resources: [
                {
                    type: 'tool',
                    title: 'Tiktokenizer',
                    author: 'Tiktoken',
                    url: 'https://tiktokenizer.vercel.app/',
                    readTime: 'Tool'
                },
                {
                    type: 'article',
                    title: 'What are tokens and how to count them?',
                    author: 'OpenAI Help',
                    url: 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them',
                    readTime: '5 min'
                }
            ]
        },
        '2-3': {
            title: '优化Prompt降低成本',
            description: '通过精简Context和结构化输出，在不降低质量的前提下压缩成本。',
            resources: [
                {
                    type: 'article',
                    title: 'Prompt Engineering Techniques for Cost Reduction',
                    author: 'Medium',
                    url: 'https://medium.com/@choice/optimizing-llm-costs-strategies-for-efficient-ai-deployment-85beccpf598',
                    readTime: '8 min'
                }
            ]
        },
        '3-1': {
            title: 'RAG技术与知识库构建',
            description: 'Retrieval Augmented Generation：让模型拥有海量私有知识。',
            resources: [
                {
                    type: 'video',
                    title: 'What is RAG? (Retrieval Augmented Generation)',
                    author: 'IBM Technology',
                    url: 'https://www.youtube.com/watch?v=T-D1OfcDW1M',
                    duration: '6 min'
                },
                {
                    type: 'article',
                    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
                    author: 'Facebook AI Research',
                    url: 'https://arxiv.org/abs/2005.11401',
                    readTime: 'Paper'
                },
                {
                    type: 'guide',
                    title: 'Building a RAG Application',
                    author: 'LangChain',
                    url: 'https://python.langchain.com/docs/use_cases/question_answering/',
                    readTime: 'Tutorial'
                }
            ]
        },
        '3-2': {
            title: 'Fine-tuning与模型定制',
            description: '当Prompt无法满足需求时，如何微调模型以适应特定场景。',
            resources: [
                {
                    type: 'video',
                    title: 'Fine-tuning LLMs with PEFT and LoRA',
                    author: 'Hugging Face',
                    url: 'https://www.youtube.com/watch?v=Us5ZFp16PaU',
                    duration: '18 min'
                },
                {
                    type: 'guide',
                    title: 'Fine-tuning Guide',
                    author: 'OpenAI',
                    url: 'https://platform.openai.com/docs/guides/fine-tuning',
                    readTime: 'Doc'
                }
            ]
        },
        '3-3': {
            title: '多模态AI产品设计',
            description: '融合视觉、听觉与文本，打造下一代交互体验。',
            resources: [
                {
                    type: 'video',
                    title: 'GPT-4V (Vision) System Card',
                    author: 'OpenAI',
                    url: 'https://cdn.openai.com/papers/GPTV_System_Card.pdf',
                    duration: 'PDF'
                },
                {
                    type: 'article',
                    title: 'Multimodal Deep Learning',
                    author: 'Stanford',
                    url: 'https://stanford.edu/class/cs231n/',
                    readTime: 'Course'
                }
            ]
        }
    };

    const modal = document.getElementById('checkpoint-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.getElementById('modal-close');
    const markCompleteBtn = document.getElementById('modal-mark-complete');

    let currentCheckpointId = null;

    // Load saved progress from Supabase or localStorage
    const savedProgress = await loadUserData('roadmap-progress', []);
    savedProgress.forEach(id => {
        const el = document.querySelector(`.checkpoint[data-checkpoint="${id}"]`);
        if (el) el.classList.add('completed');
    });

    // Helper: Build Resource Card
    function buildResourceHTML(resources) {
        if (!resources || resources.length === 0) return '<p class="text-muted">暂无推荐资源</p>';

        return `<div class="resource-list">
            ${resources.map(res => {
            let iconClass = 'fa-link';
            if (res.type === 'video') iconClass = 'fa-youtube';
            if (res.type === 'article' || res.type === 'guide') iconClass = 'fa-file-text';
            if (res.type === 'pdf') iconClass = 'fa-file-pdf';

            // For this minimalist design, we might use simple emojis or SVG icons if FA not available
            // Using simple text content structure

            return `
                <a href="${res.url}" target="_blank" class="resource-card">
                    <div class="resource-icon ${res.type}">
                        ${getIconForType(res.type)}
                    </div>
                    <div class="resource-info">
                        <div class="resource-title">${res.title}</div>
                        <div class="resource-meta">
                            <span class="resource-author">${res.author}</span>
                            <span class="resource-sep">•</span>
                            <span class="resource-time">${res.duration || res.readTime}</span>
                        </div>
                    </div>
                    <div class="resource-arrow">→</div>
                </a>
                `;
        }).join('')}
        </div>`;
    }

    function getIconForType(type) {
        switch (type) {
            case 'video': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
            case 'article': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
            case 'guide': return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
            default: return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
    }

    // Click handlers
    document.querySelectorAll('.checkpoint').forEach(cp => {
        cp.addEventListener('click', () => {
            const id = cp.dataset.checkpoint;

            // Default empty structure if not found
            const data = checkpointData[id] || {
                title: cp.querySelector('.checkpoint-title').innerText,
                description: '内容正在建设中...',
                resources: []
            };

            currentCheckpointId = id;
            modalTitle.innerText = data.title;

            // Render Description + Resources
            modalBody.innerHTML = `
                <p class="modal-description">${data.description}</p>
                <h4 class="resource-section-title">精选学习资源 (Recommended)</h4>
                ${buildResourceHTML(data.resources)}
            `;

            // Check if already completed - update button text
            updateButtonState();

            modal.classList.add('active');
        });
    });

    function updateButtonState() {
        if (savedProgress.includes(currentCheckpointId)) {
            markCompleteBtn.innerText = '已完成';
            markCompleteBtn.classList.add('completed');
        } else {
            markCompleteBtn.innerText = '标记为完成';
            markCompleteBtn.classList.remove('completed');
        }
    }

    // Close Modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Toggle completion status
    markCompleteBtn.addEventListener('click', () => {
        if (!currentCheckpointId) return;

        const el = document.querySelector(`.checkpoint[data-checkpoint="${currentCheckpointId}"]`);
        const index = savedProgress.indexOf(currentCheckpointId);

        if (index === -1) {
            // Mark as complete
            savedProgress.push(currentCheckpointId);
            if (el) el.classList.add('completed');
        } else {
            // Mark as incomplete
            savedProgress.splice(index, 1);
            if (el) el.classList.remove('completed');
        }

        saveUserData('roadmap-progress', savedProgress);
        updateButtonState();
    });
}

/* ========================================
   6. Interactive Reading List
   ======================================== */
async function initReadingList() {
    const listContainer = document.getElementById('reading-list');
    const addBtn = document.getElementById('reading-add-btn');
    const formContainer = document.getElementById('reading-form');
    const titleInput = document.getElementById('reading-title');
    const descInput = document.getElementById('reading-desc');
    const linkInput = document.getElementById('reading-link');
    const saveBtn = document.getElementById('reading-save');
    const cancelBtn = document.getElementById('reading-cancel');

    if (!listContainer) return;

    // Default reading list
    const defaultList = [
        { id: 1, title: 'Attention is All You Need', desc: 'Transformer架构的开山之作', link: 'https://arxiv.org/abs/1706.03762' },
        { id: 2, title: 'RAG: Retrieval-Augmented Generation', desc: '知识库增强生成' },
        { id: 3, title: 'Constitutional AI', desc: 'AI对齐与安全性研究' }
    ];

    // Load from Supabase or localStorage
    let readingList = await loadUserData('reading-list', defaultList);
    let editingId = null;

    function saveList() {
        saveUserData('reading-list', readingList);
    }

    function renderList() {
        if (readingList.length === 0) {
            listContainer.innerHTML = '<li class="reading-empty">暂无阅读列表，点击 + 添加</li>';
            return;
        }

        listContainer.innerHTML = readingList.map(item => {
            const titleHTML = item.link
                ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="reading-item-title">${item.title}</a>`
                : `<div class="reading-item-title">${item.title}</div>`;
            return `
            <li class="reading-item" data-id="${item.id}">
                <div class="reading-item-content">
                    ${titleHTML}
                    ${item.desc ? `<div class="reading-item-desc">${item.desc}</div>` : ''}
                </div>
                <div class="reading-item-actions">
                    <button class="btn-icon-sm edit" title="编辑">✎</button>
                    <button class="btn-icon-sm delete" title="删除">×</button>
                </div>
            </li>
        `}).join('');

        // Attach event listeners
        listContainer.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.closest('.reading-item').dataset.id);
                editItem(id);
            });
        });

        listContainer.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.closest('.reading-item').dataset.id);
                deleteItem(id);
            });
        });
    }

    function showForm(item = null) {
        editingId = item ? item.id : null;
        titleInput.value = item ? item.title : '';
        descInput.value = item ? item.desc : '';
        linkInput.value = item ? (item.link || '') : '';
        formContainer.classList.remove('hidden');
        titleInput.focus();
    }

    function hideForm() {
        formContainer.classList.add('hidden');
        titleInput.value = '';
        descInput.value = '';
        linkInput.value = '';
        editingId = null;
    }

    function editItem(id) {
        const item = readingList.find(i => i.id === id);
        if (item) showForm(item);
    }

    function deleteItem(id) {
        readingList = readingList.filter(i => i.id !== id);
        saveList();
        renderList();
    }

    function saveItem() {
        const title = titleInput.value.trim();
        const desc = descInput.value.trim();
        const link = linkInput.value.trim();

        if (!title) {
            titleInput.focus();
            return;
        }

        if (editingId) {
            // Update existing
            const item = readingList.find(i => i.id === editingId);
            if (item) {
                item.title = title;
                item.desc = desc;
                item.link = link;
            }
        } else {
            // Add new
            const newId = readingList.length > 0 ? Math.max(...readingList.map(i => i.id)) + 1 : 1;
            readingList.push({ id: newId, title, desc, link });
        }

        saveList();
        renderList();
        hideForm();
    }

    // Event listeners
    addBtn.addEventListener('click', () => showForm());
    cancelBtn.addEventListener('click', hideForm);
    saveBtn.addEventListener('click', saveItem);

    // Enter key to save
    titleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveItem();
    });

    // Initial render
    renderList();
}

/* ========================================
   Quiz Module
   ======================================== */
function initQuiz() {

    // 1. Inject Quiz Buttons
    const checkpoints = document.querySelectorAll('.checkpoint');
    checkpoints.forEach(cp => {
        const titleEl = cp.querySelector('.checkpoint-title');
        // Handle case where title might be complex or just text
        const moduleName = titleEl.textContent.trim();

        // Check if we have quiz data for this module

        if (quizData && quizData[moduleName] && quizData[moduleName].length > 0) {
            // Check if button already exists to avoid duplicates
            if (cp.querySelector('.quiz-btn')) return;

            const btn = document.createElement('button');
            btn.className = 'quiz-btn';
            btn.textContent = '开始答题';
            btn.title = `开始 ${moduleName} 测验`;

            // Prevent event bubbling so clicking button doesn't trigger checkpoint expansion
            btn.addEventListener('click', (e) => {

                e.stopPropagation();
                startQuiz(moduleName);
            });

            // Insert after title
            // Use flexbox in CSS to align them, but simply appending to parent also works if parent is flex
            // The parent .checkpoint likely has flex-direction column or row?
            // Let's check styling. .checkpoint is flex row usually.
            cp.appendChild(btn);
        }
    });

    // 2. Modal interactions
    const modal = document.getElementById('quiz-modal');
    const closeBtn = document.getElementById('close-quiz');
    const closeResultBtn = document.getElementById('close-quiz-result-btn');
    const restartBtn = document.getElementById('restart-quiz-btn');
    const nextBtn = document.getElementById('next-question-btn');

    const closeModal = () => {
        modal.classList.remove('active');
        modal.classList.add('hidden');
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (closeResultBtn) closeResultBtn.onclick = closeModal;

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    if (restartBtn) restartBtn.onclick = () => startQuiz(currentQuizModule);

    if (nextBtn) nextBtn.onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuizQuestions.length) {
            renderQuestion();
        } else {
            showResults();
        }
    };
}

// Quiz State
let currentQuizModule = '';
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let isAnswered = false;

function startQuiz(moduleName) {
    currentQuizModule = moduleName;
    currentQuizQuestions = quizData[moduleName];
    currentQuestionIndex = 0;
    score = 0;
    isAnswered = false;

    // Show Modal
    const modal = document.getElementById('quiz-modal');
    modal.classList.remove('hidden');
    modal.classList.add('active');

    // Update Header
    const titleEl = document.getElementById('quiz-module-title');
    if (titleEl) titleEl.textContent = moduleName;

    // Reset Views
    const bodyEl = document.getElementById('quiz-body');
    const resultsEl = document.getElementById('quiz-results');
    if (bodyEl) bodyEl.classList.remove('hidden');
    if (resultsEl) resultsEl.classList.add('hidden');

    renderQuestion();
}

function renderQuestion() {
    isAnswered = false;
    if (!currentQuizQuestions || currentQuizQuestions.length === 0) return;

    const question = currentQuizQuestions[currentQuestionIndex];

    // UI Elements
    const progressEl = document.getElementById('quiz-progress');
    const questionEl = document.getElementById('quiz-question');
    const optionsContainer = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('next-question-btn');

    // Update Progress
    if (progressEl) progressEl.textContent = `Question ${currentQuestionIndex + 1}/${currentQuizQuestions.length}`;

    // Update Question
    if (questionEl) questionEl.textContent = question.question;

    // Clear previous options
    if (optionsContainer) optionsContainer.innerHTML = '';

    // Hide feedback & Next button
    if (feedbackEl) feedbackEl.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');

    // Render Options
    if (optionsContainer && question.options) {
        question.options.forEach(optText => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';

            // Extract A/B/C/D key
            // Assuming format "A. content" or just "A"
            const optionKey = optText.charAt(0); // 'A', 'B', etc.

            // Create nice label
            // Check if text starts with "A. " or similar
            let labelText = optionKey + ".";
            let contentText = optText;

            // If the text actually includes "A. ", strip it for clean display
            if (optText.match(/^[A-D]\.\s/)) {
                contentText = optText.substring(3).trim();
            } else if (optText.match(/^[A-D]\s/)) {
                contentText = optText.substring(2).trim();
            }

            optionDiv.innerHTML = `<span class="option-label">${labelText}</span><span>${contentText}</span>`;

            optionDiv.onclick = () => handleAnswer(optionKey, optionDiv, question);

            optionsContainer.appendChild(optionDiv);
        });
    }
}

function handleAnswer(selectedKey, selectedDiv, questionData) {
    if (isAnswered) return; // Prevent changing answer
    isAnswered = true;

    const correctKey = questionData.answer.trim();
    const options = document.querySelectorAll('.quiz-option');
    const feedbackEl = document.getElementById('quiz-feedback');
    const feedbackMsg = document.getElementById('feedback-message');
    const feedbackExp = document.getElementById('feedback-explanation');
    const nextBtn = document.getElementById('next-question-btn');

    // Highlight correct/incorrect
    if (selectedKey === correctKey) {
        score++;
        selectedDiv.classList.add('selected', 'correct');
        if (feedbackEl) feedbackEl.className = 'quiz-feedback correct';
        if (feedbackMsg) feedbackMsg.textContent = 'Correct!';
    } else {
        selectedDiv.classList.add('selected', 'incorrect');
        if (feedbackEl) feedbackEl.className = 'quiz-feedback incorrect';
        if (feedbackMsg) feedbackMsg.textContent = 'Incorrect';

        // Highlight the correct one
        options.forEach(opt => {
            const optLabel = opt.querySelector('.option-label').textContent; // "A."
            if (optLabel.startsWith(correctKey)) {
                opt.classList.add('correct');
            }
        });
    }

    // Show Explanation
    if (feedbackExp) feedbackExp.textContent = questionData.explanation;
    if (feedbackEl) feedbackEl.classList.remove('hidden');

    // Show Next Button
    if (nextBtn) {
        nextBtn.classList.remove('hidden');
        // Change Next Button text if last question
        if (currentQuestionIndex === currentQuizQuestions.length - 1) {
            nextBtn.textContent = 'Finish Quiz';
        } else {
            nextBtn.textContent = 'Next Question';
        }
    }
}

function showResults() {
    const bodyEl = document.getElementById('quiz-body');
    const resultsEl = document.getElementById('quiz-results');
    if (bodyEl) bodyEl.classList.add('hidden');
    if (resultsEl) resultsEl.classList.remove('hidden');

    const total = currentQuizQuestions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const scoreVal = document.getElementById('final-score');
    if (scoreVal) scoreVal.textContent = percentage;

    const msgEl = document.getElementById('score-message');
    if (msgEl) {
        if (percentage === 100) {
            msgEl.textContent = "Perfect score! You're a master!";
        } else if (percentage >= 80) {
            msgEl.textContent = "Great job! You have a solid understanding.";
        } else if (percentage >= 60) {
            msgEl.textContent = "Good effort. Review the modules to improve.";
        } else {
            msgEl.textContent = "Keep learning! Don't give up.";
        }
    }
}
/* ========================================
   Custom Select Component
   ======================================== */
function initCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select-wrapper');

    customSelects.forEach(wrapper => {
        const select = wrapper.querySelector('select');
        if (!select || select.style.display === 'none') return; // Skip if already initialized or invalid

        // Hide original select
        select.style.display = 'none';

        // Create Custom UI
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';

        // Initial selected text
        const selectedOption = select.options[select.selectedIndex];
        trigger.innerHTML = `<span>${selectedOption.text}</span><div class="arrow"></div>`;

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-options';

        // Build options
        Array.from(select.options).forEach(option => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            if (option.selected) customOption.classList.add('selected');
            customOption.dataset.value = option.value;
            customOption.textContent = option.text;

            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                // Update select value
                select.value = option.value;
                // Trigger change event manually
                select.dispatchEvent(new Event('change'));

                // Update UI
                trigger.querySelector('span').textContent = option.text;
                optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                customOption.classList.add('selected');
                customSelect.classList.remove('open');
            });

            optionsContainer.appendChild(customOption);
        });

        // Assemble
        customSelect.appendChild(trigger);
        customSelect.appendChild(optionsContainer);
        wrapper.appendChild(customSelect);

        // Toggle Open/Close
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other selects
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== customSelect) s.classList.remove('open');
            });
            customSelect.classList.toggle('open');
        });
    });

    // Close when clicking outside
    window.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
    });
}

/* ==================== READING LIST MODULE ==================== */
function initReadingList() {
    const listEl = document.getElementById('reading-list');
    const addBtn = document.getElementById('reading-add-btn');
    const formEl = document.getElementById('reading-form');
    const saveBtn = document.getElementById('reading-save');
    const cancelBtn = document.getElementById('reading-cancel');
    const titleInput = document.getElementById('reading-title');
    const linkInput = document.getElementById('reading-link');
    const descInput = document.getElementById('reading-desc');

    let items = JSON.parse(localStorage.getItem('reading-list') || '[]');
    let editIndex = -1;

    function render() {
        listEl.innerHTML = items.map((item, index) => {
            const linkHtml = item.link ? `<a href='${item.link}' target='_blank' class='reading-link-icon' title='打开链接'>🔗</a>` : '';
            return `<li class='reading-item'>
                <div class='reading-content'>
                    <div class='reading-title-row'><strong>${item.title}</strong>${linkHtml}</div>
                    <div class='text-muted'>${item.desc || ''}</div>
                </div>
                <div class='reading-actions'>
                    <button class='btn-icon edit-btn' data-index='${index}'>✎</button>
                    <button class='btn-icon delete-btn' data-index='${index}'>×</button>
                </div>
            </li>`;
        }).join('');

        // Bind events
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => startEdit(e.target.dataset.index));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteItem(e.target.dataset.index));
        });
    }

    function startEdit(index) {
        editIndex = index;
        titleInput.value = items[index].title;
        linkInput.value = items[index].link || '';
        descInput.value = items[index].desc || '';
        formEl.classList.remove('hidden');
        saveBtn.textContent = '更新';
    }

    function deleteItem(index) {
        if (confirm('确定要删除吗？')) {
            items.splice(index, 1);
            save();
        }
    }

    function save() {
        localStorage.setItem('reading-list', JSON.stringify(items));
        render();
        resetForm();
    }

    function resetForm() {
        titleInput.value = '';
        linkInput.value = '';
        descInput.value = '';
        editIndex = -1;
        formEl.classList.add('hidden');
        saveBtn.textContent = '保存';
    }

    addBtn.addEventListener('click', () => {
        editIndex = -1;
        formEl.classList.remove('hidden');
        titleInput.focus();
    });

    cancelBtn.addEventListener('click', resetForm);

    saveBtn.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const link = linkInput.value.trim();
        const desc = descInput.value.trim();
        if (!title) return alert('请输入标题');

        const entry = { title, link, desc, date: new Date().toISOString() };
        if (editIndex > -1) {
            items[editIndex] = entry;
        } else {
            items.push(entry);
        }
        save();
    });

    render();
}






/* ==================== INDUSTRY NEWS SECTION ==================== */
function initNewsSection() {
    const newsGrid = document.getElementById('news-grid');
    const newsDateEl = document.getElementById('news-date');
    if (!newsGrid) return;

    // Display current date
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    if (newsDateEl) newsDateEl.textContent = dateStr;

    // Cloudflare Pages Functions API (same domain, no cross-origin issues)
    const WORKER_API_URL = '/api/news';

    // RSS Feed Sources - Chinese Tech Media via RSSHub (fallback)
    const rssSources = [
        { url: 'https://rsshub.app/latepost', iconUrl: 'https://www.latepost.com/favicon.ico', source: '晚点LatePost', tags: ['科技', '深度'] },
        { url: 'https://rsshub.app/geekpark/breakingnews', iconUrl: 'https://www.geekpark.net/favicon.ico', source: '极客公园', tags: ['科技', '创新'] },
        { url: 'https://rsshub.app/jiqizhixin', iconUrl: 'https://www.jiqizhixin.com/favicon.ico', source: '机器之心', tags: ['AI', '研究'] },
        { url: 'https://rsshub.app/qbitai/category/AI', iconUrl: 'https://www.qbitai.com/favicon.ico', source: '量子位', tags: ['AI', '前沿'] },
        { url: 'https://rsshub.app/jike/topic/6360f69931b64376510df2e9', iconUrl: 'https://web.okjike.com/favicon.ico', source: '即刻', tags: ['社区', 'AI'] }
    ];

    // RSSHub typically has CORS enabled, try direct first, fallback to proxy
    const CORS_PROXY = '';

    // Fallback static data (used if all feeds fail)
    const fallbackData = [
        { id: 1, iconUrl: 'https://www.latepost.com/favicon.ico', title: '晚点独家：科技行业最新动态', desc: '深度报道科技公司战略与行业趋势。', url: 'https://www.latepost.com/', tags: ['科技', '深度'], time: '近期' },
        { id: 2, iconUrl: 'https://www.jiqizhixin.com/favicon.ico', title: '机器之心：AI研究前沿', desc: '追踪人工智能领域的最新研究成果。', url: 'https://www.jiqizhixin.com/', tags: ['AI', '研究'], time: '近期' },
        { id: 3, iconUrl: 'https://www.qbitai.com/favicon.ico', title: '量子位：AI产品与应用', desc: '关注AI技术的产品化与商业应用。', url: 'https://www.qbitai.com/', tags: ['AI', '前沿'], time: '近期' }
    ];

    // Show loading state
    newsGrid.innerHTML = '<div class="news-loading"><span class="loading"></span> 正在加载最新资讯...</div>';

    // Try Worker API first, then fallback to RSSHub
    async function loadNews() {
        // Method 1: Try Cloudflare Worker (Tavily-powered)
        if (WORKER_API_URL) {
            try {
                const response = await fetch(WORKER_API_URL);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        renderNewsCards(data);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Worker API failed, falling back to RSSHub:', error);
            }
        }

        // Method 2: Fallback to RSSHub direct fetch
        loadAllFeeds();
    }

    async function fetchRSSFeed(source) {
        try {
            const response = await fetch(CORS_PROXY + encodeURIComponent(source.url));
            if (!response.ok) throw new Error('Network error');
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Parse RSS items
            const items = xml.querySelectorAll('item');
            const newsItems = [];

            items.forEach((item, index) => {
                if (index >= 2) return; // Max 2 per source
                const title = item.querySelector('title')?.textContent || 'Untitled';
                const link = item.querySelector('link')?.textContent || source.url;
                const description = item.querySelector('description')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent;

                // Clean HTML from description
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = description;
                const cleanDesc = tempDiv.textContent?.substring(0, 100) + '...' || '';

                // Format time
                let timeStr = '近期';
                if (pubDate) {
                    const date = new Date(pubDate);
                    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
                    if (diffHours < 1) timeStr = '刚刚';
                    else if (diffHours < 24) timeStr = `${diffHours}小时前`;
                    else if (diffHours < 48) timeStr = '1天前';
                    else timeStr = `${Math.floor(diffHours / 24)}天前`;
                }

                newsItems.push({
                    id: `${source.source}-${index}`,
                    iconUrl: source.iconUrl,
                    title: title,
                    desc: cleanDesc,
                    url: link,
                    source: source.source,
                    tags: source.tags,
                    time: timeStr
                });
            });

            return newsItems;
        } catch (error) {
            console.warn(`Failed to fetch ${source.source}:`, error);
            return [];
        }
    }

    async function loadAllFeeds() {
        try {
            const feedPromises = rssSources.map(source => fetchRSSFeed(source));
            const results = await Promise.allSettled(feedPromises);

            let allNews = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.length > 0) {
                    allNews = allNews.concat(result.value);
                }
            });

            // If no feeds worked, use fallback
            if (allNews.length === 0) {
                allNews = fallbackData;
            }

            // Sort by time (most recent first) and limit to 6
            allNews = allNews.slice(0, 6);

            renderNewsCards(allNews);
        } catch (error) {
            console.error('Failed to load news feeds:', error);
            renderNewsCards(fallbackData);
        }
    }

    function renderNewsCards(newsData) {
        if (newsData.length === 0) {
            newsGrid.innerHTML = '<div class="news-empty">暂无资讯，请稍后刷新</div>';
            return;
        }

        newsGrid.innerHTML = newsData.map(news => `
            <a href="${news.url}" target="_blank" rel="noopener" class="news-card" data-id="${news.id}">
                <div class="news-card-header">
                    <img class="news-icon-img" src="${news.iconUrl}" alt="" onerror="this.style.display='none'">
                    <span class="news-time">${news.time}</span>
                </div>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-desc">${news.desc}</p>
                <div class="news-tags">
                    ${news.tags.map(tag => `<span class="news-tag">${tag}</span>`).join('')}
                </div>
            </a>
        `).join('');
    }

    // Start loading news (tries Worker API first, then RSSHub)
    loadNews();
}


/* ==================== THEME TOGGLE FUNCTION ==================== */
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const themeOptions = document.querySelectorAll('.theme-option');

    if (!toggleBtn) return;

    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Toggle button click (quick toggle)
    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Dropdown option click
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            applyTheme(theme);
        });
    });

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update active state on dropdown options
        themeOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
    }
}
