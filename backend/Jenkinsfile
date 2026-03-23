pipeline {
    agent any

    environment {
        DOTNET_SYSTEM_GLOBALIZATION_INVARIANT = 'true'
    }

    tools {
        dotnetsdk 'dotnet10' 
    }

    stages {
        stage('Restore & Build') {
            steps {
                dir('backend') {
                    sh "dotnet restore Youtube.slnx"
                    sh "dotnet build Youtube.slnx --configuration Release"
                }
            }
        }

        stage('Run Tests & Report') {
            steps {
                dir('backend') {
                 
                    sh "dotnet test Youtube.Tests/Youtube.Tests.csproj --no-build --configuration Release --logger \"trx;LogFileName=test-results.xml\""
                }
            }
        }
    }

    post {
        always {
            mstest testResults: '**/test-results.xml'
            
        }
    }
}
