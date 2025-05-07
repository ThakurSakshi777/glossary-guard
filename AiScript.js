let prompt = document.querySelector("#prompt");
let submitBtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyC7iCYTfKMQMWgBfL0Iv3GWQE7qjlRDvAA";

let user = {
    message: null
};

async function GenerateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");
    
    let RequestOption = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [{
                "parts": [{ "text": user.message }]
            }]
        })
    };

    try {
        let response = await fetch(API_URL, RequestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        text.innerHTML = apiResponse;
    } catch (error) {
        console.log(error);
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function handleChatResponse(userMessage) {
    user.message = userMessage;
      let html=`<img src="user.png.jpg" alt="" id="userImage" width="8%">
<div class="user-chat-area">
    ${user.message}</div>
                </div>`;
    prompt.value = "";
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });



    setTimeout(() => {
        let html = `<div class="ai-chat-box">
                        <img src="Robot.png.png" alt="AI" width="13%">
                        <div class="ai-chat-area">
                             <img src="loading.gif" alt="Loading" class="load" width="50px">
                        </div>
                    </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        GenerateResponse(aiChatBox);
    }, 600);
}

prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        handleChatResponse(prompt.value);
    }
});

submitBtn.addEventListener("click" ,() => {
    handleChatResponse(prompt.value);
})