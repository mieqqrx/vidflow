pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Restore') {
            steps {
                bat "dotnet restore Youtube.slnx"
            }
        }

        stage('Build') {
            steps {
                bat "dotnet build Youtube.slnx --configuration Release"
            }
        }

        stage('Run Tests & Report') {
            steps {
                bat "dotnet test Youtube.Tests/Youtube.Tests.csproj --no-build --configuration Release --logger \"junit;LogFileName=test-results.xml\""
            }
        }
    }

    post {
        always {
            junit '**/test-results.xml'
        }
    }
}
