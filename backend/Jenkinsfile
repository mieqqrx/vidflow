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
                sh "dotnet restore Youtube.slnx"
            }
        }

        stage('Build') {
            steps {
                sh "dotnet build Youtube.slnx --configuration Release"
            }
        }

        stage('Run Tests & Report') {
            steps {
                sh "dotnet test Youtube.Tests/Youtube.Tests.csproj --no-build --configuration Release --logger 'junit;LogFileName=test-results.xml'"
            }
        }
    }

    post {
        always {
            junit '**/TestResults/*.xml'
        }
    }
}
