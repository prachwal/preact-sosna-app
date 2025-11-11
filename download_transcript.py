#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from youtube_transcript_api import YouTubeTranscriptApi
import json

def get_transcript(video_id):
    try:
        # Create API instance
        yt_api = YouTubeTranscriptApi()

        # Get the transcript - try Polish first, then English
        transcript = yt_api.fetch(video_id, languages=['pl', 'en'])

        # Convert to list of dictionaries for JSON serialization
        transcript_data = []
        for entry in transcript:
            transcript_data.append({
                'text': entry.text,
                'start': entry.start,
                'duration': entry.duration
            })

        # Save to file
        with open(f'transcript_{video_id}.json', 'w', encoding='utf-8') as f:
            json.dump(transcript_data, f, ensure_ascii=False, indent=2)

        # Also save as plain text (clean version without timestamps)
        with open(f'transcript_{video_id}_clean.txt', 'w', encoding='utf-8') as f:
            for entry in transcript:
                # Remove extra whitespace and normalize
                clean_text = entry.text.strip()
                if clean_text:
                    f.write(clean_text + " ")

        print(f"✅ Transcript downloaded successfully!")
        print(f"📄 JSON file: transcript_{video_id}.json")
        print(f"📝 Text file with timestamps: transcript_{video_id}.txt")
        print(f"🧹 Clean text file: transcript_{video_id}_clean.txt")

        # Print first few lines
        print("\n📋 First 10 lines of transcript:")
        for i, entry in enumerate(list(transcript)[:10]):
            print(f"{entry.start:.1f}s: {entry.text}")

        return transcript_data

    except Exception as e:
        print(f"❌ Error downloading transcript: {e}")
        return None

if __name__ == "__main__":
    video_id = "OmIK2RgXt_U"
    print(f"🎥 Downloading transcript for video: {video_id}")
    transcript = get_transcript(video_id)