import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp()

export const onMessageCreate=functions.database
.ref('/rooms/{roomId}/messages/{messageId}')
.onCreate((snapshot,context)=>{
    const roomId=context.params.roomsId
    const messageId=context.params.messageId
    console.log(`New message${messageId} in room ${roomId}`)
    const messageData=snapshot.val()
    const text=addPizzaazz(messageData.text)
    return snapshot.ref.update({text:text})
})

function addPizzaazz(text:string): string{

    return text.replace(/\bpizza\b/g,'pitza')
}

export const getBostonAreaWeather = 
functions.https.onRequest((request,response)=>{
    admin.firestore().doc("areas/greater-boston").get()
    .then(areaSnapshot =>{
        const cities=areaSnapshot.data().cities
        const promises=[];
        for(const city of cities){
            const p = admin.firestore().doc(`cities-weather/${city}`).get()
            promises.push(p)
        }
        return Promise.all(promises)
    })
    .then(citySnapshots=>{
        const results = []
            citySnapshots.forEach(citySnap=>{
                const data=citySnap.data()
                results.push(data)
            })
            response.send(results)        
    })
    .catch(error=>{

        console.log(error)
        response.status(500).send(error)
    });

})

export const getBostonWeather = 
functions.https.onRequest(async(request, response) => {
    try{
        const snapShot = await admin.firestore().doc('cities-weather/boston-ma-us').get()
        const data=snapShot.data();
        response.send(data)
    }
    catch(error){
        console.log(error);
        response.status(500).send(error)
    }
});

export const onBostonWeatherUpdate=
functions.firestore.document('cities-weather/boston-ma-us').onUpdate(change=>{

    const after=change.after.data();
    const payload={
        data:{
            temp:String(after.temp),
            conditions:after.conditions
        }
    }
    return admin.messaging().sendToTopic('cities-weather/boston-ma-us',payload)
})
