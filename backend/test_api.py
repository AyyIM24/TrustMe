import requests

base = 'http://localhost:8000'

print('=== TEST 1: Weak password ===')
r = requests.post(f'{base}/auth/register', json={
    'username': 'testuser', 'email': 'test@test.com',
    'password': 'weak', 'confirm_password': 'weak'
})
print(f'Status: {r.status_code} | Detail: {r.json().get("detail", "")}')

print('\n=== TEST 2: Mismatched passwords ===')
r = requests.post(f'{base}/auth/register', json={
    'username': 'testuser', 'email': 'test@test.com',
    'password': 'StrongPass1!', 'confirm_password': 'Different1!'
})
print(f'Status: {r.status_code} | Detail: {r.json().get("detail", "")}')

print('\n=== TEST 3: Valid registration ===')
r = requests.post(f'{base}/auth/register', json={
    'username': 'newuser_alpha', 'email': 'alpha@fakeshield.com',
    'password': 'StrongPass1!', 'confirm_password': 'StrongPass1!'
})
print(f'Status: {r.status_code}')
token = None
if r.status_code == 200:
    token = r.json()['access_token']
    print(f'Token: OK ({len(token)} chars)')

print('\n=== TEST 4: Analyze WITH auth ===')
if token:
    r2 = requests.post(f'{base}/analyze',
        json={'text': 'Scientists discover major breakthrough in cancer treatment using AI.'},
        headers={'Authorization': f'Bearer {token}'})
    data = r2.json()
    print(f'Status: {r2.status_code} | Prediction: {data.get("prediction")} | Confidence: {data.get("confidence")}')

print('\n=== TEST 5: Analyze WITHOUT auth ===')
r = requests.post(f'{base}/analyze', json={'text': 'Scientists discover major breakthrough.'})
print(f'Status: {r.status_code} | Detail: {r.json().get("detail", "")}')

print('\n=== TEST 6: News feed ===')
r = requests.get(f'{base}/news/feed?category=technology&limit=3')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Articles returned: {data.get("total", 0)}')
arts = data.get('articles', [])
if arts:
    print(f'First: {arts[0]["title"][:70]}')

print('\n=== TEST 7: Profile endpoint ===')
if token:
    r = requests.get(f'{base}/auth/profile', headers={'Authorization': f'Bearer {token}'})
    print(f'Status: {r.status_code} | Profile: {r.json()}')
