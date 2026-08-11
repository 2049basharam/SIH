import sqlite3

def seed_real_problems():
    conn = sqlite3.connect('sih.db')
    cursor = conn.cursor()
    
    # Real SIH Problem Statements
    problems = [
        (
            "SIH25024",
            "Comprehensive Cloud-Based Practice Management & Nutrient Analysis Software",
            "Ministry of Ayush",
            "Healthcare & Biomedical Devices",
            "Software",
            "A cloud-based solution for Ayush practitioners to manage patients and analyze nutrient intakes dynamically.",
            "Fully responsive web app, integration with government healthcare APIs, nutrient breakdown reporting.",
            "React, FastAPI, PostgreSQL, AWS Cloud"
        ),
        (
            "SIH25025",
            "E-tongue for Dravya Identification",
            "Ministry of Ayush",
            "Healthcare & Biomedical Devices",
            "Hardware",
            "A electronic device capable of identifying Ayurvedic formulations (Dravya) using electrochemical sensors.",
            "Working electronic tongue prototype with calibration algorithms.",
            "Arduino, Electrodes, Machine Learning classifiers"
        ),
        (
            "SIH25021",
            "AI-based Laser QR Code Marking on Track Fittings",
            "Ministry of Railways",
            "Infrastructure & Logistics",
            "Hardware",
            "Automated railway track fitting tracking using laser-etched QR codes scanned and verified by on-track AI vision cameras.",
            "Laser printing module with automated computer vision track inspection interface.",
            "Laser systems, OpenCV, Raspberry Pi, Python"
        ),
        (
            "SIH25022",
            "Maximizing Section Throughput Using AI-Powered Train Traffic Control",
            "Ministry of Railways",
            "Infrastructure & Logistics",
            "Software",
            "Deep learning scheduling models to automatically route train movements on single/double line sections to reduce delays.",
            "Interactive routing dashboard with real-time simulator.",
            "Python, TensorFlow, React, WebSockets"
        ),
        (
            "SIH25010",
            "Smart Crop Advisory System for Small & Marginal Farmers",
            "Govt. of Punjab",
            "Agriculture, FoodTech & Rural Development",
            "Software",
            "A local language-supported mobile application giving automated, geolocation-specific pest advisory and crop price alerts.",
            "Android/iOS app with multilingual voice command support.",
            "React Native, Python, Weather API, NLP Models"
        ),
        (
            "SIH25015",
            "Intelligent Autonomous Pesticide Sprinkling Drone",
            "Govt. of Punjab",
            "Agriculture, FoodTech & Rural Development",
            "Hardware",
            "An autonomous multi-rotor drone that maps farms and dynamically sprinkles pesticides only on affected crop areas using edge AI.",
            "Ready-to-fly octacopter equipped with edge cameras and sprinkling nozzle controls.",
            "PX4 Autopilot, Jetson Nano, PyTorch, Sprayers"
        ),
        (
            "SIH25004",
            "Image-based Breed Recognition for Cattle & Buffaloes",
            "Ministry of Fisheries, Animal Husbandry & Dairying",
            "Agriculture, FoodTech & Rural Development",
            "Software",
            "An AI tool to recognize Indian cattle breeds and buffaloes from user-submitted mobile photos to verify government subsidy eligibility.",
            "Mobile-friendly web classifier API with breed report exports.",
            "FastAPI, PyTorch (ResNet), React"
        ),
        (
            "SIH25003",
            "Low-Cost Transportation Module for Agri-produce from Remote Farms",
            "Ministry of Development of North Eastern Region",
            "Infrastructure & Logistics",
            "Hardware",
            "A low-cost gravity-based pulley/cable system for transport of agricultural produce across hilly terrains in North-East India.",
            "Mechanical blueprint with load testing reports and low-cost structural prototype.",
            "Mechanical engineering, steel cables, pulleys, gravity brakes"
        )
    ]
    
    try:
        inserted_count = 0
        for pid, title, org, theme, cat, desc, exp, tech in problems:
            # Check if exists
            cursor.execute("SELECT id FROM problem_statements WHERE problem_id=?", (pid,))
            existing = cursor.fetchone()
            
            if not existing:
                cursor.execute(
                    """INSERT INTO problem_statements 
                    (problem_id, title, organization, theme, category, description, expected_solution, technology_area, active_status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                    (pid, title, org, theme, cat, desc, exp, tech)
                )
                inserted_count += 1
                
        conn.commit()
        print(f"Successfully seeded {inserted_count} real-world SIH problem statements!")
    except Exception as e:
        print("Error seeding problem statements:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    seed_real_problems()
