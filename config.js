/* ========================================
   SiliconFlow API Configuration
   ======================================== */

// API Configuration
const API_CONFIG = {
    baseURL: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-sfybscjsihuaisplvhxrqkoannulaoecpbsdiqflnuastdxl',

    // Available models with display names
    models: {
        // 推理能力强 - DeepSeek V3.2
        'deepseek-v3': {
            id: 'deepseek-ai/DeepSeek-V3',
            name: 'DeepSeek-V3.2',
            description: '推理能力强，适合复杂任务',
            icon: '🧠'
        },
        // 多模态视觉 - GLM-4.6V
        'glm-4v': {
            id: 'zai-org/GLM-4.6V',
            name: 'GLM-4.6V',
            description: '支持图像理解的多模态模型',
            icon: ''
        },
        // 通义千问视觉 - Qwen3-VL
        'qwen3-vl': {
            id: 'Qwen/Qwen2.5-VL-32B-Instruct',
            name: 'Qwen3-VL-32B',
            description: '32B参数多模态模型',
            icon: '🎨'
        },
        // 免费模型备选
        'qwen-7b': {
            id: 'Qwen/Qwen2.5-7B-Instruct',
            name: 'Qwen2.5-7B',
            description: '免费轻量模型',
            icon: '⚡'
        }
    },

    // Default model for different features
    defaultModels: {
        playground: 'deepseek-ai/DeepSeek-V3',
        prdGenerator: 'deepseek-ai/DeepSeek-V3'
    }
};

/* ========================================
   API Helper Functions
   ======================================== */

/**
 * Get model ID from key
 */
function getModelId(modelKey) {
    const model = API_CONFIG.models[modelKey];
    return model ? model.id : modelKey;
}

/**
 * Get all available models for UI display
 */
function getAvailableModels() {
    return Object.entries(API_CONFIG.models).map(([key, model]) => ({
        key,
        ...model
    }));
}

/**
 * Call SiliconFlow Chat Completion API
 * @param {Object} options - API call options
 * @param {string} options.model - Model name or key
 * @param {Array} options.messages - Chat messages
 * @param {number} options.temperature - Temperature (0-2)
 * @param {number} options.top_p - Top-P (0-1)
 * @param {number} options.max_tokens - Max tokens
 * @param {boolean} options.stream - Enable streaming
 * @param {Function} options.onChunk - Callback for streaming chunks
 * @param {Function} options.onThinking - Callback for reasoning content (DeepSeek)
 * @returns {Promise<Object>} API response
 */
async function callSiliconFlowAPI(options) {
    const {
        model = API_CONFIG.defaultModels.playground,
        messages,
        temperature = 0.7,
        top_p = 0.9,
        max_tokens = 2000,
        stream = false,
        onChunk = null,
        onThinking = null
    } = options;

    // Resolve model ID if key is provided
    const resolvedModel = getModelId(model) || model;

    const requestBody = {
        model: resolvedModel,
        messages,
        temperature,
        top_p,
        max_tokens,
        stream
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`
    };

    try {
        const response = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        // Handle streaming response
        if (stream && onChunk) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices[0]?.delta;

                            // Handle reasoning content (DeepSeek thinking)
                            if (delta?.reasoning_content && onThinking) {
                                onThinking(delta.reasoning_content);
                            }

                            // Handle regular content
                            if (delta?.content) {
                                onChunk(delta.content);
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }

            return { stream: true };
        }

        // Handle non-streaming response
        const data = await response.json();
        return data;

    } catch (error) {
        console.error('SiliconFlow API Error:', error);
        throw error;
    }
}

/**
 * Extract content from API response
 */
function extractContent(response) {
    return response.choices[0]?.message?.content || '';
}

/**
 * Extract reasoning content from API response (for DeepSeek)
 */
function extractReasoningContent(response) {
    return response.choices[0]?.message?.reasoning_content || '';
}

/**
 * Extract token usage from API response
 */
function extractTokenUsage(response) {
    return {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
    };
}

/**
 * Check if API key is configured
 */
function isAPIConfigured() {
    return API_CONFIG.apiKey && API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE';
}

/**
 * Get API key setup instructions
 */
function getAPISetupInstructions() {
    return `API已配置，可以直接使用！`;
}
