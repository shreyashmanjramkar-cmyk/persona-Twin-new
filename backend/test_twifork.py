import asyncio
from twikit import Client

async def main():
    client = Client('en-US')
    try:
        user = await client.get_user_by_screen_name('elonmusk')
        print(f"Name: {user.name}")
        print(f"Bio: {user.description}")
        print(f"Followers: {user.followers_count}")
        
        tweets = await client.get_user_tweets(user.id, 'Tweet')
        if tweets:
            for tweet in tweets[:3]:
                print(f"- {tweet.text}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
