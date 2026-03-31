# 签证文件翻译器

自动将签证申请文档从图像翻译成专业的英文 PDF。

## 功能特点

- **自动 OCR**：尝试多种 OCR 方法（macOS Vision、EasyOCR、Tesseract）
- **双语 PDF**：原始图像 + 专业英文翻译
- **多语言支持**：支持中文和其他语言
- **专业格式**：适合官方签证申请
- **全自动化**：无需人工干预

## 支持的文档

- 存款证明 (Bank deposit certificates)
- 在职证明 (Employment certificates)
- 退休证明 (Retirement certificates)
- 收入证明 (Income certificates)
- 房产证明 (Property certificates)
- 营业执照 (Business licenses)
- 身份证和护照

## 使用方法

```bash
/visa-doc-translate <image-file>
```

### 示例

```bash
/visa-doc-translate RetirementCertificate.PNG
/visa-doc-translate BankStatement.HEIC
/visa-doc-translate EmploymentLetter.jpg
```

## 输出

创建 `<filename>_Translated.pdf`，包含：
- **第 1 页**：原始文档图像（居中，A4 大小）
- **第 2 页**：专业英文翻译

## 依赖要求

### Python 库
```bash
pip install pillow reportlab
```

### OCR（任选其一）

**macOS（推荐）**：
```bash
pip install pyobjc-framework-Vision pyobjc-framework-Quartz
```

**跨平台**：
```bash
pip install easyocr
```

**Tesseract**：
```bash
brew install tesseract tesseract-lang
pip install pytesseract
```

## workflow process

1. 必要时将 HEIC 转换为 PNG
2. 检查并应用 EXIF 旋转
3. 使用可用的 OCR 方法提取文本
4. 翻译成专业英文
5. 生成双语 PDF

## 适用场景

- 澳大利亚签证申请
- 美国签证申请
- 加拿大签证申请
- 英国签证申请
- 欧盟签证申请

## 许可证

MIT
