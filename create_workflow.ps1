$workflowContent = @"
name: Deploy Wildfire Prediction System

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.9]

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python `${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: `${{ matrix.python-version }}
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest pytest-cov
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    
    - name: Run tests
      run: |
        pytest --cov=./ --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: false

  lint:
    name: Lint
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install flake8 black isort
    
    - name: Check code formatting with Black
      run: black --check --line-length 100 .
    
    - name: Check import order with isort
      run: isort --check-only --profile black .
    
    - name: Lint with flake8
      run: flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

  deploy-dev:
    name: Deploy to Dev
    needs: [test, lint]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        npm install -g serverless
        npm install -g serverless-python-requirements serverless-prune-plugin serverless-api-gateway-throttling
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: `${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: `${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Deploy serverless backend (dev)
      run: |
        cd backend
        serverless deploy --stage dev
      env:
        NODE_OPTIONS: --max-old-space-size=4096

  deploy-frontend:
    name: Deploy Frontend
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    
    - name: Build
      run: |
        cd frontend
        npm run build
      env:
        REACT_APP_API_URL: `${{ secrets.REACT_APP_API_URL }}
    
    - name: Deploy to GitHub Pages
      uses: JamesIves/github-pages-deploy-action@v4
      with:
        folder: frontend/build
        branch: gh-pages

  deploy-prod:
    name: Deploy to Production
    needs: [deploy-dev]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main' && startsWith(github.event.head_commit.message, 'release:')
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        npm install -g serverless
        npm install -g serverless-python-requirements serverless-prune-plugin serverless-api-gateway-throttling
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: `${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: `${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Deploy serverless backend (production)
      run: |
        cd backend
        serverless deploy --stage prod
      env:
        NODE_OPTIONS: --max-old-space-size=4096

  monitor-setup:
    name: Setup Monitoring
    needs: [deploy-dev]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install boto3 requests
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: `${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: `${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Setup Monitoring with UptimeRobot
      run: |
        python scripts/setup_monitoring.py
      env:
        UPTIME_ROBOT_API_KEY: `${{ secrets.UPTIME_ROBOT_API_KEY }}
        API_GATEWAY_URL: `${{ secrets.API_GATEWAY_URL }}
"@

Set-Content -Path ".github/workflows/deploy.yml" -Value $workflowContent 