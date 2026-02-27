import re

# The why* keys for each language (inline format)
why_keys = {
    'hi': "whyTitle: 'HealthLens आपकी कैसे मदद करता है', whyDesc: 'हमारी AI-संचालित सुविधाओं के साथ स्वास्थ्य शिक्षा का भविष्य अनुभव करें', whySymptomEd: 'लक्षण शिक्षा', whySymptomEdDesc: 'अपने लक्षणों के संभावित कारणों के बारे में जानें।', whyAiChat: 'AI स्वास्थ्य चैट', whyAiChatDesc: 'फॉलो-अप प्रश्न पूछें और तुरंत उत्तर पाएं।', whyRisk: 'जोखिम मूल्यांकन', whyRiskDesc: 'स्वास्थ्य निर्णयों को प्राथमिकता देने के लिए जोखिम स्तर जानें।', whySeekCare: 'कब देखभाल लें', whySeekCareDesc: 'जानें कब लक्षणों को पेशेवर ध्यान की आवश्यकता है।', whySelfCare: 'स्व-देखभाल सुझाव', whySelfCareDesc: 'व्यक्तिगत स्व-देखभाल सिफारिशें प्राप्त करें।'",
    'bn': "whyTitle: 'HealthLens কীভাবে আপনাকে সাহায্য করে', whyDesc: 'আমাদের AI-চালিত সুবিধাগুলির সাথে স্বাস্থ্য শিক্ষার ভবিষ্যৎ অভিজ্ঞতা করুন', whySymptomEd: 'লক্ষণ শিক্ষা', whySymptomEdDesc: 'আপনার লক্ষণের সম্ভাব্য কারণ সম্পর্কে জানুন।', whyAiChat: 'AI স্বাস্থ্য চ্যাট', whyAiChatDesc: 'ফলো-আপ প্রশ্ন করুন এবং তাৎক্ষণিক উত্তর পান।', whyRisk: 'ঝুঁকি মূল্যায়ন', whyRiskDesc: 'স্বাস্থ্য সিদ্ধান্তকে অগ্রাধিকার দিতে ঝুঁকির স্তর জানুন।', whySeekCare: 'কখন যত্ন নেবেন', whySeekCareDesc: 'জানুন কখন লক্ষণে পেশাদার মনোযোগ প্রয়োজন।', whySelfCare: 'স্ব-যত্ন পরামর্শ', whySelfCareDesc: 'ব্যক্তিগত স্ব-যত্ন সুপারিশ পান।'",
    'ta': "whyTitle: 'HealthLens உங்களுக்கு எப்படி உதவுகிறது', whyDesc: 'எங்கள் AI-இயக்கப்படும் அம்சங்களுடன் சுகாதார கல்வியின் எதிர்காலத்தை அனுபவியுங்கள்', whySymptomEd: 'அறிகுறி கல்வி', whySymptomEdDesc: 'உங்கள் அறிகுறிகளின் சாத்தியமான காரணங்களைப் பற்றி அறியுங்கள்.', whyAiChat: 'AI சுகாதார அரட்டை', whyAiChatDesc: 'தொடர்ச்சியான கேள்விகளைக் கேளுங்கள், உடனடி பதில்களைப் பெறுங்கள்.', whyRisk: 'ஆபத்து மதிப்பீடு', whyRiskDesc: 'சுகாதார முடிவுகளுக்கு முன்னுரிமை அளிக்க ஆபத்து நிலையைப் பெறுங்கள்.', whySeekCare: 'எப்போது கவனிக்க வேண்டும்', whySeekCareDesc: 'அறிகுறிகளுக்கு தொழில்முறை கவனிப்பு எப்போது தேவை என்பதை அறியுங்கள்.', whySelfCare: 'சுய-பராமரிப்பு குறிப்புகள்', whySelfCareDesc: 'தனிப்பயனாக்கப்பட்ட சுய-பராமரிப்பு பரிந்துரைகளைப் பெறுங்கள்.'",
    'te': "whyTitle: 'HealthLens మీకు ఎలా సహాయపడుతుంది', whyDesc: 'మా AI-ఆధారిత ఫీచర్లతో ఆరోగ్య విద్య యొక్క భవిష్యత్తును అనుభవించండి', whySymptomEd: 'లక్షణ విద్య', whySymptomEdDesc: 'మీ లక్షణాల సాధ్యమైన కారణాల గురించి తెలుసుకోండి.', whyAiChat: 'AI ఆరోగ్య చాట్', whyAiChatDesc: 'ఫాలో-అప్ ప్రశ్నలు అడగండి మరియు తక్షణ సమాధానాలు పొందండి.', whyRisk: 'రిస్క్ అసెస్\u200cమెంట్', whyRiskDesc: 'ఆరోగ్య నిర్ణయాలకు ప్రాధాన్యత ఇవ్వడానికి రిస్క్ స్థాయిని తెలుసుకోండి.', whySeekCare: 'ఎప్పుడు సంరక్షణ తీసుకోవాలి', whySeekCareDesc: 'లక్షణాలకు వృత్తిపరమైన శ్రద్ధ ఎప్పుడు అవసరమో తెలుసుకోండి.', whySelfCare: 'స్వీయ-సంరక్షణ చిట్కాలు', whySelfCareDesc: 'వ్యక్తిగతీకరించిన స్వీయ-సంరక్షణ సిఫార్సులు పొందండి.'",
    'kn': "whyTitle: 'HealthLens ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ', whyDesc: 'ನಮ್ಮ AI-ಚಾಲಿತ ವೈಶಿಷ್ಟ್ಯಗಳೊಂದಿಗೆ ಆರೋಗ್ಯ ಶಿಕ್ಷಣದ ಭವಿಷ್ಯವನ್ನು ಅನುಭವಿಸಿ', whySymptomEd: 'ಲಕ್ಷಣ ಶಿಕ್ಷಣ', whySymptomEdDesc: 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಸಂಭವನೀಯ ಕಾರಣಗಳ ಬಗ್ಗೆ ತಿಳಿಯಿರಿ.', whyAiChat: 'AI ಆರೋಗ್ಯ ಚಾಟ್', whyAiChatDesc: 'ಫಾಲೋ-ಅಪ್ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ಮತ್ತು ತಕ್ಷಣ ಉತ್ತರಗಳನ್ನು ಪಡೆಯಿರಿ.', whyRisk: 'ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ', whyRiskDesc: 'ಆರೋಗ್ಯ ನಿರ್ಧಾರಗಳಿಗೆ ಆದ್ಯತೆ ನೀಡಲು ಅಪಾಯ ಮಟ್ಟವನ್ನು ತಿಳಿಯಿರಿ.', whySeekCare: 'ಯಾವಾಗ ಆರೈಕೆ ಪಡೆಯಬೇಕು', whySeekCareDesc: 'ಲಕ್ಷಣಗಳಿಗೆ ವೃತ್ತಿಪರ ಗಮನ ಯಾವಾಗ ಬೇಕು ಎಂದು ತಿಳಿಯಿರಿ.', whySelfCare: 'ಸ್ವಯಂ-ಆರೈಕೆ ಸಲಹೆಗಳು', whySelfCareDesc: 'ವೈಯಕ್ತಿಕ ಸ್ವಯಂ-ಆರೈಕೆ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ.'",
    'mr': "whyTitle: 'HealthLens तुम्हाला कसे मदत करते', whyDesc: 'आमच्या AI-संचालित वैशिष्ट्यांसह आरोग्य शिक्षणाचे भविष्य अनुभवा', whySymptomEd: 'लक्षण शिक्षण', whySymptomEdDesc: 'तुमच्या लक्षणांच्या संभाव्य कारणांबद्दल जाणून घ्या.', whyAiChat: 'AI आरोग्य चॅट', whyAiChatDesc: 'फॉलो-अप प्रश्न विचारा आणि त्वरित उत्तरे मिळवा.', whyRisk: 'जोखीम मूल्यांकन', whyRiskDesc: 'आरोग्य निर्णयांना प्राधान्य देण्यासाठी जोखीम पातळी जाणून घ्या.', whySeekCare: 'कधी काळजी घ्यावी', whySeekCareDesc: 'लक्षणांना व्यावसायिक लक्ष कधी आवश्यक आहे ते जाणून घ्या.', whySelfCare: 'स्व-काळजी टिप्स', whySelfCareDesc: 'वैयक्तिक स्व-काळजी शिफारसी मिळवा.'",
}

for lang_code, keys_str in why_keys.items():
    file_path = f'd:/AIhealth/src/lib/i18n/translations/{lang_code}.ts'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Remove all previously inserted why* lines (the broken multi-line insertion)
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip any line that starts with a whyXxx key
        if stripped.startswith('whyTitle:') or stripped.startswith('whyDesc:') or \
           stripped.startswith('whySymptomEd:') or stripped.startswith('whySymptomEdDesc:') or \
           stripped.startswith('whyAiChat:') or stripped.startswith('whyAiChatDesc:') or \
           stripped.startswith('whyRisk:') or stripped.startswith('whyRiskDesc:') or \
           stripped.startswith('whySeekCare:') or stripped.startswith('whySeekCareDesc:') or \
           stripped.startswith('whySelfCare:') or stripped.startswith('whySelfCareDesc:'):
            continue
        cleaned_lines.append(line)
    content = '\n'.join(cleaned_lines)

    # Step 2: Find the statsSatisfaction value and add why keys after it, on the same line
    # Pattern: statsSatisfaction: 'value' },  (end of home object)
    # or: statsSatisfaction: 'value', ... }, (before closing brace)
    # We need to insert before the closing },
    
    # Find statsSatisfaction in the home object
    idx = content.find('statsSatisfaction:')
    if idx == -1:
        print(f"ERROR: statsSatisfaction not found in {lang_code}.ts")
        continue

    # Find the value - it's after the colon, in quotes
    colon_idx = content.find(':', idx)
    # Find the opening quote
    q1 = content.find("'", colon_idx)
    # Find the closing quote
    q2 = content.find("'", q1 + 1)
    
    # Now check what comes after the closing quote
    after = content[q2+1:].lstrip()
    
    # We need to ensure there's a comma after statsSatisfaction value,
    # then add the why keys, then close the home object
    
    # If the next char after value is a comma, we keep it
    # If it's }, we need to add comma + keys before }
    
    # Simple approach: replace from statsSatisfaction value end to the home object closing
    # Find the closing of the home section: the next }, or } after statsSatisfaction
    
    # Find the position right after the closing quote of statsSatisfaction
    insert_pos = q2 + 1
    
    # Check if there's already a comma
    rest = content[insert_pos:]
    rest_stripped = rest.lstrip()
    
    if rest_stripped.startswith(','):
        # There's a comma, remove everything until the next meaningful content
        comma_pos = content.find(',', insert_pos)
        # Replace: after comma, skip whitespace, then check for } or other content
        after_comma = content[comma_pos+1:].lstrip()
        if after_comma.startswith('}'):
            # Pattern: statsSatisfaction: 'val', }, -> add keys before }
            brace_pos = content.find('}', comma_pos+1)
            new_content = content[:comma_pos+1] + ' ' + keys_str + ' ' + content[brace_pos:]
        else:
            # Already has content after comma, just insert
            new_content = content[:comma_pos+1] + ' ' + keys_str + ',' + content[comma_pos+1:]
    else:
        # No comma after the value
        if rest_stripped.startswith('}'):
            # Pattern: statsSatisfaction: 'val' }, -> add comma + keys before }
            brace_pos = content.find('}', insert_pos)
            new_content = content[:insert_pos] + ', ' + keys_str + ' ' + content[brace_pos:]
        else:
            # Just add comma and keys
            new_content = content[:insert_pos] + ', ' + keys_str + content[insert_pos:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Fixed {lang_code}.ts")

print("All files fixed!")
