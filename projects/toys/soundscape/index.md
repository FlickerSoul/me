---
title: Soundscape
#subtitle: 
abstract: An Android application providing hands-free navigation using spatial audio,  empowering visually impaired people to navigate the world at ease. This project is brought to you by 8 UCL Software Systems Engineering students.
lang: en
#langs: 
tags: 
  - Android
  - kotlin
  - C++
createdAt: 2024-04-03
updatedAt: 2023-04-03
#hidden: 
#hasComments:
---

## Introduction

The idea of using Spatial Audio to navigate isn't new. Soundscape was originally incubated and developed on iOS by Microsoft Research. The app serves spatial audio to indicate the user's destination and surroundings as if the sound comes from th ose places, by leveraging the global position and orientation obtained from AirPods' the head tracking sensors and other sensors from user's phones (such as GPS and magnetometer). The app, designed with visually impaired people in mind, provides a hands-free navigation experience, allowing users to navigate the world and get familiar with their surroundings.

However, the app is only available on iOS, which has only a relatively small market share, compared to its competitor, Android. Therefore, the cofonder of the project requested 8 of us in UCL Software Systems Engineering to port a minimal viable product of Soundscape to Android.

The project  first went though the planning phase, where were discussed the requirements,  the architecture,  and the timeline. The app has several  core features:

- **Navigation with audio beacon**: the app indicates the user's destination using a continuous audio cue that changes it's quality based on the user's orientation: the better the orientation is aligned with the destination, the more positive the sound cue is. We call this continuous sound cue as audio beacon.
- **Callouts of surroundings**: the app calls out the user's surroundings when they request so or when they move around. The callouts are also spatialized as if the callout sound originates from the place it describes. For example, when you walk along the street, you will hear "cafe 10 meters" from your right (because there is a cafe cross the street 10 meters away), and "bus stop, 20 meters" from your front left (because you will see a bus stop if you turn left  around in the upcoming crossing).
- **Markers and Routes**: the app allows the user to save markers (a location they are interested in, such as a particular bus stop or grocery store) and routes (a sequence of markers that the user want to follow). This allows the user to navigate themselves to where they want to be easily.

We have also implemented many other essential functionalities such as settings that controls many aspects of audio, the integration with Google maps, and accessibility integrations with TalkBack and VoiceOver.

The architecture of Soundscape is designed to be event driven. This is because the audios are played based on the user's location, orientation, and movement, which are all events that flow from sensors or user interactions.

We divided 8 of us into 4 groups, each responsible for a different component of the app:

- UI team: all the UI components and data persistence
- Map team: integrations with Google Maps and OpenStreetMap, along with utilities for computations and data pipeline of objects on the maps
- Sensor team: sensor data retrieval as services and sensor data processing
- Audio team: audio engine that uses Text-to-Speech to synthesis callouts from text, spatializes, mixes, and plays audio cues and callouts, and provides a event loop for callouts responding to user movements.
- Both sensor team ang audio team work on a event bus that's used to carry data and share among modules.

Because of the time constraint, there are still many great features that  weren't listed in our planning. However, we hope the future team can take over our work and continue making Soundscape a  complete and optimal navigation solution for people who need it.

## Technologies, Challenges, and What I Have Done

We decided to use Kotlin (with JNI) for developmemt, Jetpack Compose for UI, Room for persistence, and, latter in the course, hilt (dagger) for dependency injection and proto DataStore for lightweight data persistence duch as values in settings.

I worked in the audio team, addling with Raimund, because I think the audio part is the most challenging and interesting component of the app. It turned put to be true, because unlike iOS which provides many AMAZING high-level and yet POWERFUL audio APIs and access to AirPods' head tracking sensors, Android has very limited APIs that allow  the level of customizability and control we need.

The process of building the audio part has mainly three stages: making a audio renderer from a existing low-level audio engine, implementing state-aware players that can play, pause, and queue audios to be spatialized and rendered (played) by the audio renderer, and creating and providing a service containing the functionalities to other parts of the app.

The first step was to find a suitable audio engine for audio spatialization and customization. It was clear to us that it is impossible to implement an engine from scratch and that there didn't seem to exit anything high level in the kotlin world. We decided to use JNI and focus on engines implemented in C or C++. There are many choices on the market: Steam Audio, Oboe, OpenAL, FMOD, SoLoud, etc. We chose SoLoud because it is open source, powerful, and lightweight. The only down side is that SoLoud, even though it works, is not actively maintained: the existing audio backend support for Android (OpenSL ES) is already deprecated, and the new backend (AAidio) is out of horizon.

Thee process of choosing an engine wasn't easy. I personally did not have any prior experience regarding audio processing, not to mention audio spatialization and mixing. I and Raimund spent quite some time figuring out what exactly we need and what each engine can offer. Raimund's great information gathering ability led us to Steam Audio and SoLoud. We played and struggled with steam audio first, and found it offers spatialization (and mixing if I remember correctly), but it does not offer playing capability, one of the things we also desperately needed. SoLoud, on the other hand, offers everything we needed and stroke us with its simplicity and ease of use. After around a week of researching, we decided to go with SoLoud.

Once we've decided SoLoud is our choice, we started to creating APIs for kotlin world using JNI. This was basically done by an wrapper over SoLoud along with necessary data structures, such as bytes of audio source, and specific JNI bridge functions that creates and interacting with pointers to the wrapper instances. Together, we allowed kotlin to prepare audio sources for playing, play, pause, stop, and spatializes audio the sources, and thus we have a audio renderer, completing the first stage.

One of the tricky things we encountered was changing the audio cues based the quality of user orientation. As mentioned, the closer the user is facing the destination, the more positive the sound cue is. Internally, we have 2 to 4 tracks per sound cue; every track has the same length and each track has a different positiveness. To allow transition from one track to another, we first decided to natively play all tracks at the same time but only allow the one appropriate track to have an audible volume while others' volumes are set to 0; as the user changes their orientation, different tracks will have their volumes changed accordingly. However, because SoLoud does not provide a way to do this batch action: turn up the volume of one track and turn down that of the other, one has to do this one by one, which incurs delays in between the changes and breaking the continuity of what the user would hear. We then wrote our own batch action and achieved a better effect, although it is still not perfect. We are currently experimenting a beat system, mimicking wha's been done on the iOS side. Essentially, each sound cue had number of beats and these beats are marks of spots on which changing tracks wont be noticable. This also means all of the tracks of the cue have the same number of beats, meaning even though the currently playing track can be changed at any time, we only change it on the best, creating a seamless transition. To do so efficiently, we are creating a audio data source that's aware of the bytes of all tracks and the number of beats; the audio data source serves the bytes of the track that's currently playing and starts to serve the bytes of the next track when the end of a beat is reached.

[I can put some audio samples here]

Once we had the renderer, we needed to invent players to play, pause, and queue audio sources to be rendered by the renderer. In our design, there are two kinds of players in the app: the one that plays audio beacon _**continuously**_ (meaning it's always playing unless it's paused or stopped) and the one that plays callouts _**discretely**_ (meaning it plays one thing at a time in the queue, and stops if there are nothing to play). The two kinds of players share many comment processes and states, thus finding the balance and creating a common abstract class that can be reused in both players are crucial and intricate. I am pretty happy and proud of the abstraction I've created.

The hardest part turned out to be dealing with threading (or coroutines) and race conditions. This is due to the nature of an application which uses the main thread for UI and other background threads for various tasks. Audio playing is included 

(To be continued)