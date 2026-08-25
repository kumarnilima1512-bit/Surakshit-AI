# 🛡️ Surakshit AI

### AI-Powered Predictive Personnel Stress & Welfare Monitoring System

> **Smart India Hackathon 2026 · Problem Statement: SIH26186**

**Surakshit AI** is a privacy-first AI-powered welfare platform designed to identify early indicators of **stress, burnout, emotional fatigue, and welfare concerns** among personnel working in demanding and high-pressure operational environments.

The platform combines operational/workload indicators with voluntary wellness assessments to provide **explainable risk insights, welfare recommendations, and timely alerts for authorized welfare personnel**.

---

## 🎯 Problem

Personnel serving in CAPFs, Armed Forces and other uniformed services may experience increased stress due to:

* Extended deployments
* Irregular duty schedules
* High operational workload
* Separation from family
* Frequent transfers
* Training commitments
* Limited recovery time

Traditional identification often depends on manual observation or self-reporting, which can delay timely welfare support.

---

## 💡 Our Solution

Surakshit AI provides an integrated web and mobile platform for proactive personnel welfare monitoring.

```text id="c8w9sc"
Personnel & Wellness Data
          ↓
    Secure Processing
          ↓
     AI Risk Engine
          ↓
  Explainable Prediction
          ↓
 Welfare Recommendations
          ↓
Authorized Welfare Personnel
          ↓
 Follow-up & Risk Trends
```

The system is designed to **support human welfare decisions, not replace them**.

---

## 🚀 Key Features

* 🧠 **Stress & Burnout Risk Prediction**
* 📱 **Mobile Wellness & Self-Assessment App**
* 📊 **Personnel Welfare Dashboard**
* 🔍 **Explainable AI (XAI)**
* 📈 **Risk Trend Monitoring**
* 💡 **Welfare Intervention Recommendations**
* 🔔 **Early-Warning Alerts**
* 🔐 **Role-Based Access Control**
* 🛡️ **Consent & Privacy Management**
* 🔒 **Secure Data Handling**

---

## 📱 Android Application

The personnel-facing mobile application will be developed using **Flutter and Dart**.

Personnel can use the application to:

* Sign in securely
* Provide consent
* Complete voluntary wellness assessments
* View personal wellness insights
* Monitor risk trends
* Receive welfare recommendations

The Android application will be distributed as an **APK** for the hackathon prototype.

### APK Distribution

The Surakshit AI website will provide a dedicated **Download Android App** option.

```text id="l5i4l3"
Surakshit AI Website
        ↓
Download Android App
        ↓
Surakshit AI APK
        ↓
Install on Android Device
```

For production deployment, the application can later be distributed through an appropriate managed or official Android distribution channel.

---

## 🌐 Web Platform

The web application will provide the primary interface for authorized welfare personnel and system administrators.

Key capabilities include:

* Personnel welfare overview
* Risk-level monitoring
* Risk trend analysis
* Explainable AI insights
* Welfare alerts
* Intervention recommendations
* Role-based access

---

## 🧠 AI & ML

The AI engine will analyse structured operational and wellness data to estimate:

* Stress risk
* Burnout risk
* Overall welfare risk

Potential models include:

* Logistic Regression
* Random Forest
* XGBoost

Explainability techniques such as **SHAP** will be used to identify important factors contributing to predictions.

> **AI-generated risk indicators are not medical diagnoses and should not be used as standalone disciplinary or employment decisions.**

---

## 📊 Data Strategy

The prototype does **not** claim access to confidential CRPF personnel data.

Development and demonstration may use:

* Publicly available occupational stress/burnout datasets
* Synthetic operational datasets
* Simulated wellness/self-assessment data

Synthetic data will always be clearly identified as simulated data.

For real-world deployment, the system can be adapted to appropriately authorized and anonymized institutional data following required security, privacy and validation procedures.

---

## 🔐 Privacy & Responsible AI

Surakshit AI follows a **“Welfare, Not Surveillance”** approach.

The platform is designed around:

* Consent-based data collection
* Data minimization
* Anonymization/pseudonymization
* Role-based access control
* Secure data storage
* Explainable predictions
* Human-in-the-loop decision making

AI predictions should not directly determine:

* Promotions
* Transfers
* Punitive actions
* Disciplinary decisions
* Medical diagnoses

The goal is to **identify potential welfare concerns early and enable appropriate human-led support**.

---

## 🏗️ System Architecture

```text id="f0e4zq"
                    SURAKSHIT AI
                         │
          ┌──────────────┴──────────────┐
          │                             │
     Web Platform                 Android App
     Nuxt + Vue                   Flutter + Dart
          │                             │
          └──────────────┬──────────────┘
                         ↓
                  FastAPI Backend
                         ↓
                Secure API Layer
                         ↓
                Feature Engineering
                         ↓
                  AI/ML Engine
                  XGBoost / ML
                         ↓
                    SHAP / XAI
                         ↓
              Welfare Recommendation
                         ↓
                PostgreSQL Database
```

---

## 🛠️ Technology Stack

| Layer            | Technology                    |
| ---------------- | ----------------------------- |
| Web Frontend     | **Nuxt + Vue + Tailwind CSS** |
| Android App      | **Flutter + Dart**            |
| Backend          | **Python + FastAPI**          |
| Machine Learning | **Scikit-learn + XGBoost**    |
| Explainable AI   | **SHAP**                      |
| Database         | **PostgreSQL**                |
| Containerization | **Docker**                    |
| Version Control  | **Git + GitHub**              |

---

## 🌟 Why Surakshit AI?

Unlike a generic employee burnout prediction system, Surakshit AI focuses on the **operational context and welfare needs of uniformed services**.

Instead of simply:

```text id="1n4wsh"
Predict → Risk
```

Surakshit AI aims to:

```text id="c5d4hm"
Predict
   ↓
Explain
   ↓
Support
   ↓
Human Review
   ↓
Follow-up
   ↓
Monitor
```

This makes the system focused on **early welfare support rather than personnel surveillance or labelling**.

---

## ⚠️ Disclaimer

Surakshit AI is being developed as a prototype for **Smart India Hackathon 2026 – SIH26186**.

The current prototype does not use or claim access to confidential CRPF personnel data.

The system is not a medical diagnostic tool and does not replace qualified medical or mental-health professionals.

Real-world deployment would require appropriate institutional authorization, anonymized data, security assessment, domain-expert validation, privacy safeguards and regulatory compliance.

---

## 🏆 Hackathon Information

|                       | Details                                                 |
| --------------------- | ------------------------------------------------------- |
| **Hackathon**         | Smart India Hackathon 2026                              |
| **Problem Statement** | SIH26186                                                |
| **Organization**      | Ministry of Home Affairs                                |
| **Department**        | Central Reserve Police Force (CRPF), Police II Division |
| **Category**          | Software                                                |
| **Theme**             | MedTech / BioTech / HealthTech                          |

---

## 🚀 Vision

> **Surakshit AI — Detect Early. Explain Clearly. Support Responsibly.**

Our vision is to build a secure, explainable and privacy-conscious welfare ecosystem that helps personnel receive appropriate support at the right time.
