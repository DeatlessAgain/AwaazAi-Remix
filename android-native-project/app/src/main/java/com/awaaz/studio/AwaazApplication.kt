package com.awaaz.studio

import android.app.Application

class AwaazApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: AwaazApplication
            private set
    }
}
