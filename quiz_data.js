const quizData = {
    "理解LLM的工作原理": [
        {
            "id": 101,
            "question": "从本质上讲，GPT 这类大模型在推理时主要是在做什么？",
            "options": [
                "A. 在巨大的数据库中检索最匹配的现有答案",
                "B. 理解人类的情感并产生共鸣",
                "C. 自回归地预测下一个出现概率最高的 Token",
                "D. 实时在互联网上搜索信息并汇总"
            ],
            "answer": "C",
            "explanation": "大模型本质上是一个概率预测机器，像文字接龙一样一个接一个地生成内容。"
        },
        {
            "id": 102,
            "question": "在 LLM 语境下，Token 和我们通常理解的单词或汉字的关系是？",
            "options": [
                "A. 1个 Token 严格等于 1 个英文字母或 1 个汉字",
                "B. Token 是模型处理文本的最小单位",
                "C. Token 是指模型生成的句子的数量",
                "D. Token 是用户付费的货币单位，与文本长度无关"
            ],
            "answer": "B",
            "explanation": "理解 Tokenization 是估算成本和长度限制的基础。"
        },
        {
            "id": 103,
            "question": "模型的 Temperature 参数设置为 0 时，意味着什么？",
            "options": [
                "A. 模型停止工作，因为温度太低",
                "B. 模型采用贪婪解码策略，每次仅选择概率最高的那个 Token，输出结果趋于确定性",
                "C. 模型的创造力达到最大值",
                "D. 模型处理速度最快"
            ],
            "answer": "B",
            "explanation": "Temperature 控制采样概率的分布平滑度，0 意味着消除随机性。"
        },
        {
            "id": 104,
            "question": "Transformer 架构中，Self-Attention 机制的主要作用是？",
            "options": [
                "A. 让模型能够感知用户的语气",
                "B. 压缩长文本以节省内存",
                "C. 计算序列中每个 Token 与其他 Token 之间的关联权重，从而理解上下文依赖关系",
                "D. 自动过滤掉不重要的停用词"
            ],
            "answer": "C",
            "explanation": "注意力机制解决了 RNN 无法处理长距离依赖的问题。"
        },
        {
            "id": 105,
            "question": "Context Window 的大小限制了模型的什么能力？",
            "options": [
                "A. 模型的响应速度",
                "B. 模型在单次交互中能记住并处理的输入与输出总文本量",
                "C. 模型的训练数据截止日期",
                "D. 模型支持的语言种类"
            ],
            "answer": "B",
            "explanation": "超出窗口的信息会被截断或遗忘。"
        }
    ],
    "掌握Prompt Engineering核心技巧": [
        {
            "id": 121,
            "question": "Prompt Engineering 的核心目标最好被描述为？",
            "options": [
                "A. 寻找一种魔法咒语，让模型瞬间产生自我意识",
                "B. 通过编程语言重写模型的底层权重",
                "C. 通过优化自然语言指令的结构和内容，引导预训练模型输出更符合人类预期、更准确的结果",
                "D. 缩短模型的响应时间"
            ],
            "answer": "C",
            "explanation": "通过自然语言编程来挖掘模型潜能。"
        },
        {
            "id": 122,
            "question": "一个鲁棒的 Prompt 通常包含四个核心要素，除了指令、上下文、输出指示外，还包括？",
            "options": [
                "A. 输入数据",
                "B. 模型的版本号",
                "C. 开发者的签名",
                "D. 情感打分"
            ],
            "answer": "A",
            "explanation": "经典框架：指令、上下文、输入数据、输出指示。"
        },
        {
            "id": 123,
            "question": "Zero-shot Prompting 指的是？",
            "options": [
                "A. 模型在没有任何训练数据的情况下运行",
                "B. 直接向模型提问或下达指令，而不提供任何具体的输入输出示例",
                "C. 模型拒绝回答任何问题",
                "D. 模型生成的回答长度为 0"
            ],
            "answer": "B",
            "explanation": "不给例子，直接问。"
        },
        {
            "id": 124,
            "question": "System Prompt 在对话中的主要作用是？",
            "options": [
                "A. 用于系统报错",
                "B. 设定模型的角色设定、行为边界和全局风格",
                "C. 它是用户输入的第一个问题",
                "D. 用于计算 Token 消耗"
            ],
            "answer": "B",
            "explanation": "System Prompt 权重通常高于后续 User Prompt。"
        },
        {
            "id": 126,
            "question": "Few-shot Prompting 为什么能显著提升模型表现？",
            "options": [
                "A. 因为它增加了 Token 数量，模型觉得你很有诚意",
                "B. 利用了模型的 In-context Learning 能力，通过示例让模型快速模仿特定的输出格式、风格或逻辑",
                "C. 因为它触发了模型的微调机制",
                "D. 因为它降低了 Temperature"
            ],
            "answer": "B",
            "explanation": "给例子比单纯写指令效果好得多。"
        }
    ],
    "学会API调用与成本估算": [
        {
            "id": 141,
            "question": "调用 LLM API 时，最常见的鉴权方式是？",
            "options": [
                "A. 在 URL 中包含用户名和密码",
                "B. 在 HTTP Header 中包含 API Key",
                "C. 每次请求前先发送短信验证码",
                "D. 绑定设备的 MAC 地址"
            ],
            "answer": "B",
            "explanation": "API Key 是通行证，通常以 Bearer Token 形式传递。"
        },
        {
            "id": 142,
            "question": "OpenAI 风格的 API 接口是 Stateless 的，这意味着？",
            "options": [
                "A. 模型没有记忆功能",
                "B. API 服务器不会保存你之前的对话记录，每次请求必须把历史对话完整打包重新发送给服务器",
                "C. 模型不需要联网",
                "D. API 永远免费"
            ],
            "answer": "B",
            "explanation": "为了保持记忆，需要重复发送历史记录。"
        },
        {
            "id": 143,
            "question": "参数 max_tokens 实际上限制的是什么？",
            "options": [
                "A. 你输入的 Prompt 的长度",
                "B. 输入 Prompt + 输出 Answer 的总长度",
                "C. 模型生成的最大 Token 数量",
                "D. 你的 API 余额"
            ],
            "answer": "C",
            "explanation": "它像一个水龙头定时器，控制生成的字数。"
        },
        {
            "id": 146,
            "question": "在估算成本时，通常 1000 个 Token 大约对应多少单词量？",
            "options": [
                "A. 100 个单词",
                "B. 约 750 个单词",
                "C. 10000 个单词",
                "D. 1 个单词"
            ],
            "answer": "B",
            "explanation": "行业通用的估算经验值。"
        },
        {
            "id": 147,
            "question": "为什么目前的 LLM API 定价中，Output Token 通常比 Input Token 贵？",
            "options": [
                "A. 厂商故意杀熟",
                "B. Input 是并行处理的，计算效率高；而 Output 是串行生成的，每生成一个词都要重新计算一遍，算力成本极高",
                "C. Output 的数据更有价值",
                "D. Input 不占带宽"
            ],
            "answer": "B",
            "explanation": "Output 生成机制决定了它更占资源。"
        }
    ],
    "集成主流LLM API (OpenAI, Gemini等)": [
        {
            "id": 201,
            "question": "在使用 OpenAI 官方 Python SDK 初始化客户端时，最规范、最安全的 API Key 传递方式是？",
            "options": [
                "A. 直接硬编码在代码里",
                "B. 让用户在前端网页输入框里填，然后传给后端",
                "C. 不传参，让 SDK 自动读取系统环境变量",
                "D. 把 Key 写在 TXT 文件里读取"
            ],
            "answer": "C",
            "explanation": "硬编码极易导致 Key 泄露，环境变量是最安全的标准做法。"
        },
        {
            "id": 202,
            "question": "当你希望模型生成的代码稳定不变时，除了将 Temperature 设为 0，你还应该设置哪个参数？",
            "options": [
                "A. stream",
                "B. seed",
                "C. max_tokens",
                "D. frequency_penalty"
            ],
            "answer": "B",
            "explanation": "指定固定的随机种子能让输出结果在工程上尽可能可复现。"
        },
        {
            "id": 203,
            "question": "在 Chat Completion 接口中，role 为 system 的主要职责是？",
            "options": [
                "A. 记录用户的提问",
                "B. 设定 AI 的行为基调、人设和限制条件",
                "C. 记录 AI 的历史回答",
                "D. 用于调试"
            ],
            "answer": "B",
            "explanation": "System Message 是对话的基调，权重通常高于后续的对话内容。"
        },
        {
            "id": 207,
            "question": "在调用支持 Vision 的模型时，图片通常是以什么格式传入 API 的？",
            "options": [
                "A. 只能是图片的 URL 链接",
                "B. 只能是上传文件后的 ID",
                "C. 可以是 HTTPS URL，也可以是 Base64 编码的字符串",
                "D. 图片的二进制流"
            ],
            "answer": "C",
            "explanation": "Base64 适合本地图片，URL 适合在线图片。"
        },
        {
            "id": 216,
            "question": "面对 API 偶尔出现的 500 系列错误，最健壮的代码处理逻辑是？",
            "options": [
                "A. 打印错误日志并退出",
                "B. 甚至不需要重试，因为服务商挂了",
                "C. 捕获异常并实施短期重试",
                "D. 给用户发邮件报错"
            ],
            "answer": "C",
            "explanation": "短期重试往往能解决瞬时抖动问题。"
        }
    ],
    "实现Token计数与成本监控": [
        {
            "id": 221,
            "question": "在 Python 中，官方推荐的用于在本地准确计算 Token 数量的标准库是？",
            "options": [
                "A. nltk",
                "B. transformers",
                "C. tiktoken",
                "D. count_tokens"
            ],
            "answer": "C",
            "explanation": "tiktoken 是 OpenAI 开源的 BPE 分词器。"
        },
        {
            "id": 222,
            "question": "为什么不能简单地用字符串长度来代替 Token 计数？",
            "options": [
                "A. 因为 Token 计数是不确定的",
                "B. 因为 Tokenization 并不是按字符切割的",
                "C. 因为 API 会自动忽略空格",
                "D. 因为字符串长度不包含标点符号"
            ],
            "answer": "B",
            "explanation": "Token 与字符没有固定的比例关系。"
        },
        {
            "id": 223,
            "question": "在非流式 API 响应中，哪个字段直接告诉了你本次请求消耗的 Token 数？",
            "options": [
                "A. choices tokens",
                "B. usage",
                "C. meta cost",
                "D. system fingerprint"
            ],
            "answer": "B",
            "explanation": "usage 字段是最准确的计费依据。"
        },
        {
            "id": 226,
            "question": "在开启 Stream 的情况下，获取准确 Token 消耗的最佳实践是？",
            "options": [
                "A. 自己在本地拼接文本然后计算",
                "B. 流式模式无法获取 Token 数",
                "C. 设置 include_usage 选项，API 会在流的最后一个 Chunk 返回 usage 字段",
                "D. 等第二天看账单"
            ],
            "answer": "C",
            "explanation": "这是新特性，以前只能估算，现在可以精准获取。"
        },
        {
            "id": 236,
            "question": "为了实现用户粒度的成本监控，你需要在调用 API 时做什么？",
            "options": [
                "A. 无法实现",
                "B. 使用 user 参数传入用户的唯一 ID",
                "C. 为每个用户申请一个 API Key",
                "D. 询问用户花了多少钱"
            ],
            "answer": "B",
            "explanation": "后端应记录每次请求的 user_id 和 usage。"
        }
    ],
    "优化Prompt降低成本": [
        {
            "id": 241,
            "question": "在编写 Prompt 时，去掉所有的礼貌用语对成本有什么影响？",
            "options": [
                "A. 会导致模型生气",
                "B. 能节省 Input Token，且通常不会降低回答质量",
                "C. 会增加 Output Token",
                "D. 对成本没有影响"
            ],
            "answer": "B",
            "explanation": "机器不需要礼貌，指令效力一样但更省钱。"
        },
        {
            "id": 242,
            "question": "为什么使用英文 Prompt 通常比中文 Prompt 更省钱？",
            "options": [
                "A. 因为英语单词短",
                "B. 因为 API 对英语有折扣",
                "C. 因为在主流 Tokenizer 中，英文单词的 Token 压缩率更高",
                "D. 没有区别"
            ],
            "answer": "C",
            "explanation": "英文压缩率高是物理属性。"
        },
        {
            "id": 244,
            "question": "设置 max_tokens 参数能防止什么情况带来的成本失控？",
            "options": [
                "A. 模型拒绝回答",
                "B. 模型陷入循环生成或生成了长篇大论的废话",
                "C. 模型生成违规内容",
                "D. 模型的首字延迟变高"
            ],
            "answer": "B",
            "explanation": "作为止损刹车使用。"
        },
        {
            "id": 245,
            "question": "在 Few-Shot Prompting 中，为了降低成本，你首先应该优化哪里？",
            "options": [
                "A. 缩短 System Prompt",
                "B. 精简示例的数量和长度",
                "C. 去掉用户的问题",
                "D. 使用更贵的模型"
            ],
            "answer": "B",
            "explanation": "只保留最典型、最短的例子。"
        },
        {
            "id": 254,
            "question": "相比于直接生成 JSON，更省 Token 的替代方案是？",
            "options": [
                "A. 生成 XML",
                "B. 生成 YAML 格式",
                "C. 生成二进制代码",
                "D. 生成图片"
            ],
            "answer": "B",
            "explanation": "YAML 信息密度更高，无冗余符号。"
        }
    ],
    "RAG技术与知识库构建": [
        {
            "id": 301,
            "question": "RAG 的核心价值在于解决 LLM 的哪两个主要痛点？",
            "options": [
                "A. 推理速度慢和显存占用高",
                "B. 知识时效性滞后和私有数据不可知",
                "C. 无法处理多模态数据",
                "D. 训练成本过高"
            ],
            "answer": "B",
            "explanation": "RAG 是大模型的外挂硬盘，不需要重训即可查阅新数据。"
        },
        {
            "id": 303,
            "question": "一个标准的 RAG 流程包含哪三个核心步骤？",
            "options": [
                "A. 输入 -> 计算 -> 输出",
                "B. Indexing -> Retrieval -> Generation",
                "C. 训练 -> 测试 -> 部署",
                "D. 分词 -> 向量化 -> 排序"
            ],
            "answer": "B",
            "explanation": "索引、检索、生成。"
        },
        {
            "id": 304,
            "question": "Vector Database 在 RAG 中的核心作用是？",
            "options": [
                "A. 存储原始的 PDF 文件",
                "B. 存储文本的 Embeddings，并提供高效的近似最近邻搜索",
                "C. 存储用户的聊天记录",
                "D. 用于关系型数据查询"
            ],
            "answer": "B",
            "explanation": "它是 RAG 的搜索引擎。"
        },
        {
            "id": 312,
            "question": "为什么需要 Reranking 步骤？",
            "options": [
                "A. 因为向量数据库返回的顺序是随机的",
                "B. 使用 Cross-Encoder 模型对召回结果进行精细打分，显著提升相关性",
                "C. 为了按时间排序",
                "D. 为了节省 Token"
            ],
            "answer": "B",
            "explanation": "重排序是提升准确率的临门一脚。"
        },
        {
            "id": 313,
            "question": "Lost in the Middle 现象对 RAG 的启示是？",
            "options": [
                "A. 不要给模型太多上下文",
                "B. 应将相关性最高的文档片段放在 Context 的首尾",
                "C. 模型不喜欢中间的数字",
                "D. 上下文越长越好"
            ],
            "answer": "B",
            "explanation": "模型对中间内容的关注度较低。"
        }
    ],
    "Fine-tuning与模型定制": [
        {
            "id": 321,
            "question": "Fine-tuning 最核心的应用价值在于？",
            "options": [
                "A. 让模型学会最新的实时新闻",
                "B. 调整模型的行为模式、说话风格、指令遵循格式",
                "C. 让模型记住海量的私有数据库",
                "D. 提高模型的推理速度"
            ],
            "answer": "B",
            "explanation": "RAG 用于事实，Fine-tuning 用于形式。"
        },
        {
            "id": 322,
            "question": "相比于 Prompt Engineering，Fine-tuning 的主要优势是？",
            "options": [
                "A. 成本更低",
                "B. 能够将复杂的指令内化到模型权重中，节省 Token",
                "C. 不需要准备数据",
                "D. 模型会变得更聪明"
            ],
            "answer": "B",
            "explanation": "微调是固化的 Prompt。"
        },
        {
            "id": 326,
            "question": "LoRA 技术为什么能大幅降低微调成本？",
            "options": [
                "A. 它使用了更小的模型",
                "B. 它冻结了主权重，只训练极少量的低秩矩阵参数",
                "C. 它把数据压缩了",
                "D. 它不需要 GPU"
            ],
            "answer": "B",
            "explanation": "参数量减少了 99%。"
        },
        {
            "id": 328,
            "question": "什么是 Catastrophic Forgetting？",
            "options": [
                "A. 训练数据丢失了",
                "B. 模型在微调新任务后，丢失了预训练阶段原本掌握的通用能力",
                "C. 显存溢出",
                "D. 模型拒绝回答"
            ],
            "answer": "B",
            "explanation": "微调最大的副作用。"
        },
        {
            "id": 331,
            "question": "根据 LIMA 假设，微调数据的关键在于？",
            "options": [
                "A. 数量越多越好",
                "B. 质量至上，少量专家级示范数据",
                "C. 数据越长越好",
                "D. 必须是英文数据"
            ],
            "answer": "B",
            "explanation": "高质量数据是最好的唤醒词。"
        }
    ],
    "多模态AI产品设计": [
        {
            "id": 341,
            "question": "Multimodal 在 AI 领域的准确定义是？",
            "options": [
                "A. 能够同时处理多种语言的模型",
                "B. 能够处理和理解多种不同类型媒体数据并建立映射关系的模型",
                "C. 拥有多种性格模式的模型",
                "D. 可以在本地和云端同时运行的模型"
            ],
            "answer": "B",
            "explanation": "跨越数据模态的鸿沟。"
        },
        {
            "id": 342,
            "question": "在原生多模态模型中，视觉信息是如何被处理的？",
            "options": [
                "A. 先调用 OCR 识别出文字",
                "B. 通过 Vision Encoder 将图像直接转换为高维向量",
                "C. 模型直接像人眼一样看像素",
                "D. 把图片压缩成 Base64 字符串"
            ],
            "answer": "B",
            "explanation": "端到端处理，模型看到的是语义特征。"
        },
        {
            "id": 343,
            "question": "主流的 AI 绘画主要基于哪种技术架构？",
            "options": [
                "A. Transformer",
                "B. GAN",
                "C. Diffusion Model",
                "D. RNN"
            ],
            "answer": "C",
            "explanation": "扩散模型的原理是去噪。"
        },
        {
            "id": 344,
            "question": "CLIP 模型的贡献在于？",
            "options": [
                "A. 生成了第一张 AI 图片",
                "B. 成功将图像和文本映射到了同一个共享的潜空间",
                "C. 提高了 OCR 的准确率",
                "D. 压缩了图片体积"
            ],
            "answer": "B",
            "explanation": "连接文字世界和像素世界的桥梁。"
        },
        {
            "id": 346,
            "question": "为什么 AI 视频生成比图像生成难得多？",
            "options": [
                "A. 因为视频文件太大",
                "B. 核心难点在于时间一致性",
                "C. 因为没有视频训练数据",
                "D. 因为显卡不支持"
            ],
            "answer": "B",
            "explanation": "保证连续帧之间动作连贯。"
        }
    ]
};
