#!groovy

def BN = (BRANCH_NAME == 'master' || BRANCH_NAME.startsWith('releases/')) ? BRANCH_NAME : 'releases/2023-07'

library "knime-pipeline@$BN"

properties([
    pipelineTriggers([
        upstream('knime-core/' + env.BRANCH_NAME.replaceAll('/', '%2F')),
    ]),
    buildDiscarder(logRotator(numToKeepStr: '5')),
    disableConcurrentBuilds()
])

try {
    node('maven && java17') {
        knimetools.defaultTychoBuild(updateSiteProject: 'org.knime.update.scripting.editor')

        // TODO(AP-19379) add sonarcloud analysis
    }
} catch (ex) {
    currentBuild.result = 'FAILURE'
    throw ex
} finally {
    notifications.notifyBuild(currentBuild.result);
}
/* vim: set shiftwidth=4 expandtab smarttab: */
