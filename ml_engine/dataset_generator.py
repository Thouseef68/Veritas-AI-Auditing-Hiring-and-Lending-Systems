"""
Dataset Generator for Responsible AI Auditing in Hiring and Lending
Generates synthetic enterprise datasets embedded with realistic historical bias patterns
and DPDP Act compliance vulnerabilities for demonstrating the VeritasAI Auditor.
"""

import json
import random
import os

def generate_fincorp_loans(n=500, seed=42):
    random.seed(seed)
    
    first_names_m = ["Rahul", "Amit", "Vikram", "Suresh", "Arjun", "Farhan", "Rohan", "Deepak", "Karan", "Manish"]
    first_names_f = ["Priya", "Ananya", "Sneha", "Aditi", "Pooja", "Sunita", "Zoya", "Meera", "Divya", "Kavita"]
    last_names = ["Sharma", "Verma", "Patil", "Iyer", "Khan", "Gupta", "Deshmukh", "Chakraborty", "Reddy", "Nair"]
    
    tiers = [
        {"name": "Tier 1 (Metro)", "weight": 0.45},
        {"name": "Tier 2 (Emerging)", "weight": 0.35},
        {"name": "Tier 3 (Rural/Semi-urban)", "weight": 0.20}
    ]
    
    records = []
    
    for i in range(1, n + 1):
        app_id = f"LN-2026-{1000 + i}"
        gender = "Female" if random.random() < 0.48 else "Male"
        first_name = random.choice(first_names_f) if gender == "Female" else random.choice(first_names_m)
        full_name = f"{first_name} {random.choice(last_names)}"
        
        age = random.randint(21, 58)
        
        credit_score = int(random.gauss(690, 75))
        credit_score = max(520, min(850, credit_score))
        
        annual_income = int(random.lognormvariate(13.8, 0.55))
        annual_income = max(300000, min(4500000, annual_income))
        
        loan_amount = int(random.uniform(100000, 2000000))
        dti = round(random.uniform(0.15, 0.65), 2)
        
        tier_choice = random.choices([t["name"] for t in tiers], weights=[t["weight"] for t in tiers])[0]
        
        financial_solvency = (
            (credit_score - 520) / (850 - 520) * 0.50 +
            (annual_income / 3000000) * 0.30 +
            (1.0 - dti) * 0.20
        )
        qualified = financial_solvency >= 0.52
        
        # Historical bias in lending
        historical_score = financial_solvency
        if tier_choice == "Tier 3 (Rural/Semi-urban)":
            historical_score -= 0.16
        if gender == "Female" and age < 32:
            historical_score -= 0.14
        if gender == "Female":
            historical_score -= 0.05
            
        approved_historically = 1 if historical_score >= 0.50 else 0
        
        # PII exposure in loan application
        has_pan = random.random() < 0.25
        pan_num = f"{chr(random.randint(65,90))}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{random.randint(1000,9999)}{chr(random.randint(65,90))}" if has_pan else ""
        
        records.append({
            "applicant_id": app_id,
            "full_name": full_name,
            "gender": gender,
            "age": age,
            "tier_location": tier_choice,
            "credit_score": credit_score,
            "annual_income_inr": annual_income,
            "loan_amount_inr": loan_amount,
            "debt_to_income": dti,
            "qualified_merit": int(qualified),
            "approved_historically": approved_historically,
            "simulated_model_score": round(min(0.99, max(0.05, historical_score + random.uniform(-0.04, 0.04))), 3),
            "application_notes": f"Applicant {full_name}, age {age}, living in {tier_choice}. " + (f"PAN Card: {pan_num}. " if has_pan else "")
        })
        
    return records


def generate_techhire_resumes(n=500, seed=101):
    random.seed(seed)
    
    first_names_m = ["Rohan", "Aman", "Karthik", "Siddharth", "Naveen", "Abhishek", "Sameer", "Aditya", "Pranav", "Rajesh"]
    first_names_f = ["Pooja", "Shreya", "Neha", "Tanvi", "Rhea", "Ananya", "Ishita", "Sanya", "Simran", "Meenakshi"]
    last_names = ["Rao", "Kapoor", "Mukherjee", "Nambiar", "Joshi", "Bansal", "Mehta", "Chopra", "Kulkarni", "Das"]
    
    colleges = [
        {"name": "Tier 1 (IIT/NIT/BITS/IIIT)", "weight": 0.25},
        {"name": "Tier 2 (Top State University/Tier-2 Engg)", "weight": 0.45},
        {"name": "Tier 3 (Local Affiliated College)", "weight": 0.30}
    ]
    
    roles = ["Full Stack Engineer", "Backend Developer", "ML Engineer", "DevOps Engineer", "Frontend Specialist"]
    
    records = []
    
    for i in range(1, n + 1):
        cand_id = f"HR-2026-{2000 + i}"
        gender = "Female" if random.random() < 0.44 else "Male"
        first_name = random.choice(first_names_f) if gender == "Female" else random.choice(first_names_m)
        full_name = f"{first_name} {random.choice(last_names)}"
        
        target_role = random.choice(roles)
        years_exp = round(random.uniform(1.0, 12.0), 1)
        skills_score = int(random.gauss(72, 14))
        skills_score = max(35, min(99, skills_score))
        
        college_tier = random.choices([c["name"] for c in colleges], weights=[c["weight"] for c in colleges])[0]
        
        has_break = random.random() < (0.38 if gender == "Female" else 0.12)
        career_break_months = random.choice([6, 9, 12, 18, 24]) if has_break else 0
        
        true_merit = (skills_score / 100.0) * 0.65 + min(1.0, (years_exp / 8.0)) * 0.35
        qualified = true_merit >= 0.62
        
        screener_score = true_merit
        if career_break_months > 6:
            screener_score -= 0.22
        if college_tier == "Tier 3 (Local Affiliated College)":
            screener_score -= 0.15
        if gender == "Female":
            screener_score -= 0.08
            
        shortlisted_historically = 1 if screener_score >= 0.58 else 0
        
        has_aadhaar = random.random() < 0.18
        aadhaar_text = f"{random.randint(2000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)}" if has_aadhaar else ""
        
        has_phone = random.random() < 0.55
        phone_text = f"+91 {random.randint(7000000000, 9999999999)}" if has_phone else ""
        
        has_marital = (gender == "Female" and random.random() < 0.30) or (gender == "Male" and random.random() < 0.10)
        marital_text = "Marital Status: Married" if has_marital else ""
        
        resume_snippet = f"Candidate: {full_name}. Target Role: {target_role}. Education: B.Tech from {college_tier}. Skills Assessment: {skills_score}/100. Experience: {years_exp} years."
        if career_break_months > 0:
            resume_snippet += f" Note: Career break of {career_break_months} months for family/childcare."
        if has_marital:
            resume_snippet += f" {marital_text}."
        if has_phone:
            resume_snippet += f" Contact: {phone_text}."
        if has_aadhaar:
            resume_snippet += f" Identity Verification (Aadhaar): {aadhaar_text}."
            
        records.append({
            "candidate_id": cand_id,
            "full_name": full_name,
            "gender": gender,
            "target_role": target_role,
            "years_exp": years_exp,
            "skills_score": skills_score,
            "college_tier": college_tier,
            "career_break_months": career_break_months,
            "qualified_merit": int(qualified),
            "shortlisted_historically": shortlisted_historically,
            "simulated_model_score": round(min(0.99, max(0.05, screener_score + random.uniform(-0.03, 0.03))), 3),
            "resume_text": resume_snippet
        })
        
    return records


def main():
    os.makedirs("datasets", exist_ok=True)
    os.makedirs("web/public/data", exist_ok=True)
    
    loans = generate_fincorp_loans(500)
    with open("datasets/fincorp_loans.json", "w") as f:
        json.dump(loans, f, indent=2)
    with open("web/public/data/fincorp_loans.json", "w") as f:
        json.dump(loans, f, indent=2)
        
    resumes = generate_techhire_resumes(500)
    with open("datasets/techhire_resumes.json", "w") as f:
        json.dump(resumes, f, indent=2)
    with open("web/public/data/techhire_resumes.json", "w") as f:
        json.dump(resumes, f, indent=2)
        
    print(f"Generated {len(loans)} FinCorp loan records.")
    print(f"Generated {len(resumes)} TechHire resume records.")

if __name__ == "__main__":
    main()
