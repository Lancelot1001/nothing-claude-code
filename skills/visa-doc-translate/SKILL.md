---
name: visa-doc-translate
description: 将签证申请文件（图像）翻译成英文，并创建包含原文和译文的双语 PDF
origin: nothing-claude-code
---

你正在帮助翻译签证申请的文档。

## 说明

当用户提供图像文件路径时，自动执行以下步骤，无需询问确认：

1. **图像转换**：如果文件是 HEIC，使用 `sips -s format png <input> --out <output>` 将其转换为 PNG

2. **图像旋转**：
   - 检查 EXIF 方向数据
   - 根据 EXIF 数据自动旋转图像
   - 如果 EXIF 方向为 6，逆时针旋转 90 度
   - 根据需要应用额外旋转（如果文档看起来上下颠倒，测试 180 度）

3. **OCR 文本提取**：
   - 自动尝试多种 OCR 方法：
     - macOS Vision 框架（macOS 首选）
     - EasyOCR（跨平台，无需 tesseract）
     - Tesseract OCR（如果有）
   - 从文档中提取所有文本信息
   - 识别文档类型（存款证明、在职证明、退休证明等）

4. **翻译**：
   - 专业地将所有文本内容翻译成英文
   - 保持原始文档结构和格式
   - 使用适合签证申请的专业术语
   - 将专有名词保持在原始语言，并在括号中注明英文
   - 对于中文姓名，使用拼音格式（例如：WU Zhengye）
   - 准确保留所有数字、日期和金额

5. **PDF 生成**：
   - 使用 PIL 和 reportlab 库创建 Python 脚本
   - 第 1 页：显示旋转后的原始图像，居中并缩放以适应 A4 页面
   - 第 2 页：显示格式正确的英文翻译：
     - 标题居中加粗
     - 内容左对齐，间距适当
     - 适合正式文件的职业布局
   - 在底部添加注释："这是原始文件的认证英文翻译"
   - 执行脚本生成 PDF

6. **输出**：在与原文件相同的目录中创建名为 `<original_filename>_Translated.pdf` 的 PDF 文件

## 支持的文档

- Bank deposit certificates (存款证明)
- Income certificates (收入证明)
- Employment certificates (在职证明)
- Retirement certificates (退休证明)
- Property certificates (房产证明)
- Business licenses (营业执照)
- ID cards and passports
- Other official documents

## 技术实现

### OCR 方法（按顺序尝试）

1. **macOS Vision Framework** (macOS only):
   ```python
   import Vision
   from Foundation import NSURL
   ```

2. **EasyOCR** (cross-platform):
   ```bash
   pip install easyocr
   ```

3. **Tesseract OCR** (if available):
   ```bash
   brew install tesseract tesseract-lang
   pip install pytesseract
   ```

### 所需的 Python 库

```bash
pip install pillow reportlab
```

For macOS Vision framework:
```bash
pip install pyobjc-framework-Vision pyobjc-framework-Quartz
```

## 重要指南

- DO NOT ask for user confirmation at each step
- Automatically determine the best rotation angle
- Try multiple OCR methods if one fails
- Ensure all numbers, dates, and amounts are accurately translated
- Use clean, professional formatting
- Complete the entire process and report the final PDF location

## 使用示例

```bash
/visa-doc-translate RetirementCertificate.PNG
/visa-doc-translate BankStatement.HEIC
/visa-doc-translate EmploymentLetter.jpg
```

## 输出示例

该skill将：
1. 使用可用的 OCR 方法提取文本
2. 翻译成专业英文
3. 生成 `<filename>_Translated.pdf`，包含：
   - 第 1 页：原始文档图像
   - 第 2 页：专业英文翻译

非常适合澳大利亚、美国、加拿大、英国和其他需要翻译文件的国家/地区的签证申请。
