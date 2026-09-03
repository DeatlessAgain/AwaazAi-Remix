pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "awaazai-remix"
include(":android-native-project")
project(":android-native-project").projectDir = file("android-native-project")
include(":android-native-project:app")
project(":android-native-project:app").projectDir = file("android-native-project/app")
