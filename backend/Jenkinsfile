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
                    sh "dotnet restore VidFlow.slnx"
                    sh "dotnet build VidFlow.slnx --configuration Release"
                }
            }
        }

        stage('Run Tests & Report') {
            steps {
                dir('backend') {
                    sh "dotnet test VidFlow.Tests/VidFlow.Tests.csproj --no-build --configuration Release --logger \"trx;LogFileName=test-results.xml\""
                }
            }
        }
    }

    post {
        always {
            // Виправлений параметр для плагіна MSTest
            mstest testResultsFile: '**/test-results.xml'
        }
    }
}
