# Visual-Quality-Inspection-for-Manufacturing

## 📊 Dataset Overview — MVTec LOCO AD

**MVTec LOCO AD** is an industrial anomaly detection dataset designed to evaluate computer vision systems for detecting and localizing both **structural** and **logical anomalies** in manufactured products.

The dataset contains **3,644 high-resolution images across 5 industrial categories**. Unlike conventional defect datasets that mainly focus on surface defects, MVTec LOCO AD also evaluates whether a product satisfies its expected structural and logical constraints.

### 🔍 Types of Anomalies

- **Structural Anomalies:** Scratches, dents, contamination, and other visible physical defects.
- **Logical Anomalies:** Missing components, incorrectly positioned components, or incorrect assembly.

### 📈 Dataset Statistics

| Feature | Details |
|---|---|
| **Total Images** | 3,644 |
| **Categories** | 5 |
| **Training Images** | 1,772 |
| **Validation Images** | 304 |
| **Test Images** | 1,568 |
| **Anomaly Types** | Structural + Logical |
| **Annotations** | Pixel-level ground truth |
| **Task** | Anomaly Detection & Localization |

### 🎯 Why MVTec LOCO AD?

MVTec LOCO AD closely matches real-world **manufacturing quality inspection** scenarios. It allows a computer vision system to detect not only visible surface defects but also **missing, misplaced, or incorrectly assembled components**.

For our project, the dataset is used to develop an automated **Visual Quality Inspection System** capable of classifying products as:

- ✅ **PASS** — Product meets quality requirements
- ❌ **FAIL** — Anomaly detected

The system can also **localize anomalous regions** to help inspectors understand where the quality issue occurs.

> **Dataset:** MVTec LOCO AD  
> **Source:** MVTec, Germany  
> **License:** CC BY-NC-SA 4.0
