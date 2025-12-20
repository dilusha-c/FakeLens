# Comprehensive Analysis Test Cases

## Test 1: Fake News (Sri Lanka Internet Shutdown)
**Content:**
```
Sri Lanka to Shut Down All Internet Access Nationwide Starting Next Week

According to unnamed officials within the Sri Lankan Telecommunications Regulatory Authority, the government has reportedly finalized plans to shut down all internet access across the country starting next Monday. Sources claim this decision was made to "prevent the spread of misinformation," though the government has not published any official announcement regarding this matter.

Social media posts allege that officials declined to comment when questioned, citing national security concerns. The alleged shutdown would affect all mobile and broadband internet services nationwide, though no official statement has been made to confirm or deny these claims.
```

**Expected Verdict:** FAKE (score ≥ 60%)
**Reasons:**
- Unnamed officials
- "Reportedly", "allegedly", "sources claim"
- No official statement
- Officials declined to comment
- Only social media posts as source

---

## Test 2: True News (US Syria Strikes)
**Content:**
```
US conducts strikes in Syria in response to attack that killed two American soldiers

The United States has conducted military strikes in eastern Syria targeting Iranian-backed militia groups, according to officials. The strikes were carried out in response to a drone attack earlier this week that killed two U.S. soldiers and wounded several others at a base in the region.

Defense Secretary Lloyd Austin confirmed the operations in a statement, saying the strikes targeted facilities used by groups affiliated with Iran's Islamic Revolutionary Guard Corps. The BBC, Reuters, and other major news outlets have reported on these developments, citing official U.S. military sources.
```

**Expected Verdict:** REAL (score < 25%)
**Reasons:**
- Named official sources (Defense Secretary Lloyd Austin)
- Official statement confirmed
- Multiple credible sources (BBC, Reuters)
- No red flags present

---

## Instructions:
1. Open the FakeLens app
2. Test each scenario
3. Verify the verdict matches expectations
4. Check that explanations reference the correct factors
