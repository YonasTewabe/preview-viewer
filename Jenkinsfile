pipeline {
    agent any

    environment {
        BRANCH = 'main'                  
        SERVER_IP = '193.123.66.138'
        REMOTE_USER = 'ubuntu'
        REMOTE_DIR = "preview"
        FRONTEND_DIR = "${REMOTE_DIR}"
        BACKEND_DIR = "${REMOTE_DIR}/server"
        FRONTEND_TARGET = '/var/www/preview'
        PM2_PROCESS_NAME = 'preview-backend'
    }

    stages {
        stage('Clone or Pull Repo on Remote using HTTPS with Credentials') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'toAccessGithub', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sshagent(credentials: ['pepadmin']) {
                        script {
                            def repoUrl = "https://${GIT_USER}:${GIT_PASS}@github.com/IE-Network-Solutions/Preview-builder.git"
                            
                            sh """
                                ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                                    if [ -d "${REMOTE_DIR}/.git" ]; then
                                        cd ${REMOTE_DIR} &&
                                        git reset --hard &&
                                        git pull origin ${BRANCH}
                                    else
                                        git clone --branch ${BRANCH} ${repoUrl} ${REMOTE_DIR}
                                    fi
                                '
                            """
                        }
                    }
                }
            }
        }

                stage('Copy env') {
            steps {
                sshagent(credentials: ['pepadmin']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                            sudo cp ~/preview-env/.front ${FRONTEND_DIR}/.env &&
                            sudo cp ~/preview-env/.back ${BACKEND_DIR}/.env
                        '
                    """
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sshagent(credentials: ['pepadmin']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                            cd ${REMOTE_DIR} &&
                            npm install &&
                            cd server &&
                            npm install &&
                            npm run db:init &&
                            npm run db:migrate
                        '
                    """
                }
            }
        }

        stage('Build Frontend') {
            steps {
                sshagent(credentials: ['pepadmin']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                            cd ${REMOTE_DIR} &&
                            npm run build
                        '
                    """
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                sshagent(credentials: ['pepadmin']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                            sudo rm -rf ${FRONTEND_TARGET} &&
                            sudo mkdir -p ${FRONTEND_TARGET} &&
                            sudo cp -r ${REMOTE_DIR}/dist/* ${FRONTEND_TARGET}/
                        '
                    """
                }
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sshagent(credentials: ['pepadmin']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                            cd ${BACKEND_DIR} &&
                            if sudo pm2 list | grep -q ${PM2_PROCESS_NAME}; then
                               sudo pm2 delete ${PM2_PROCESS_NAME}
                            fi &&
                            sudo pm2 start index.js --name ${PM2_PROCESS_NAME} '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment completed successfully'
        }
        failure {
            echo '❌ Deployment failed'
        }
    }
}
