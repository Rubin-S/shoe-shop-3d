import json

transcript_path = r'C:\Users\doyen\.gemini\antigravity\brain\2ed145f7-63b4-4eb7-ae5d-17c50948cbc7\.system_generated\logs\transcript_full.jsonl'
output_path = r'C:\Users\doyen\Documents\antigravity\radiant-darwin\luxury-shoe-001\blueprint.txt'

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if '"type":"USER_INPUT"' in line and 'Given your actual situation' in line:
            data = json.loads(line)
            content = data.get('content', '')
            with open(output_path, 'w', encoding='utf-8') as out:
                out.write(content)
            print('Extracted prompt length:', len(content))
            break
