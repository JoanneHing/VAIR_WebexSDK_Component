# Webex Component for Virtual Receptionist

This codebase are used to capture meeting transcriptions, sends relevant parts of the transcription to a RASA for natural language processing, and then uses a HeyGen to generate the output video stream.

## Getting Started

To run this project, you need to set up both the client-side application (`app.js` served by `http-server`) and the HeyGen API proxy server (`server.js` using Node.js).

### Prerequisites

* **Node.js**: Ensure Node.js and npm are installed on your system.
* **npx**: Comes with npm, used to run `http-server`.

### Main Project Files

* `index.html`: The main user interface for the Webex client.
* `app.js`: The client-side JavaScript that interacts with the Webex SDK, processes transcriptions, and communicate with Rasa and HeyGen through API calls.
* `server.js`: The Node.js Express server acting as a proxy for HeyGen API calls.

### Installation and Running

1.  **Clone the Repository** (Ensure the project files are in a similar structure):

    ```bash
    your-project-folder/
    ├── Webex/
    │   ├── app.js
    │   ├── index.html
    │   └── style.css
    └── Webex/heygen-proxy/
        └── server.js
    ```

2.  **Start the Client-Side Application (`app.js`)**:
    Open your terminal, navigate to the directory **containing `app.js`** (e.g., `your-project-folder/Webex/`), and run:

    ```bash
    npx http-server -p 3000 .
    ```
    * This command starts a local HTTP server on port `3000`
    * You can then access the application by opening `http://localhost:3000/index.html` in your web browser.

3.  **Start the HeyGen Proxy Server (`server.js`)**:
    Open a **separate** terminal window, navigate to the directory **containing `server.js`** (e.g., `your-project-folder/Webex/heygen-proxy/`), and run:

    ```bash
    node server.js
    ```
    * This will start the HeyGen proxy server, typically listening on `http://localhost:3001`.

**Important**: Both `npx http-server` and `node server.js` commands must be running simultaneously (may achieve by using different terminals) for the application to function correctly.

## Pre-setting Configuration

Before using the application, you need to configure the `virtualReceptionistSpeakerId` in your `app.js` file:

* **Locate the Constant**: In the `app.js` file, find the line:
    ```javascript
    const virtualReceptionistSpeakerId = "...";
    ```
* **Input Speaker ID**: Replace `"..."` with the actual `speakerId` of your virtual receptionist account.
    * This ID can be found in the JSON response when the transcription is turned on under the "Advance Meeting Controls" section of the application itself. Look for the `speakerId` associated with your virtual receptionist's transcription when it's audio is captured.

Also in the `server.js` file, remember to update the `HEYGEN_API_KEY` to your API key.

## Operational Flow

Follow these steps to operate the Webex SDK:

### First: Auth & Registration

1.  **Input Access Token**:
    * Under the "Auth & Registration" section, locate the "Access Token" input field.
    * Input the access token for the virtual receptionist. This should be a fixed Webex account's access token.
    * The access token can be retrieved from the Webex Calling API: [Webex Calling API Getting Started](https://developer.webex.com/calling/docs/getting-started).
    * **Note**: Access tokens need to be updated every 12 hours.
2.  **Webex Init**:
    * Click the `webex.init()` tp initialize the Webex SDK.
3.  **Register Device**:
    * Under the "Registration" sub-section, click the `webex.meetings.register()` button to register your client as a device with Webex, allowing it to join meetings.

### Second: Manage Meeting Session

1.  **Create Meeting**:
    * Under the "Manage Meeting" section, in the "Choose a Meeting" fieldset, input the meeting URI that the virtual receptionist should join into the "Destination" input field.
    * Click the "Create Meeting" button.
2.  **Join with Media**:
    * Under the "Join Meeting" fieldset, locate the "Join With Media" sub-section.
    * Click the "Join with Media" button. This will connect the virtual receptionist to the meeting with its audio and video enabled.

### Third: Advance Meeting Controls

1.  **Start Transcription**:
    * Navigate to the "Advance Meeting Controls" section.
    * Under the "Transcription" fieldset, press the "Start Transcription" button.
    * **Note**: Ensure the virtual receptionist has been admitted into the meeting before starting transcription.

### Fourth: Streams Session

1.  **Captions**:
    * Under the "Streams" section, locate the "Captions" fieldset.
    * You should see the latest caption being from speakers other than the virtual receptionist itself (due to the `virtualReceptionistSpeakerId` filter).
2.  **Rasa Integration Feedback**:
    * Also under the "Streams" section, find the "RASA Integration" fieldset.
    * This section display:
        * The message sent to Rasa.
        * The status of the API call to Rasa.
        * The response received from Rasa.

## Technical Details

This section provides a technical overview of how the different components (`index.html`, `app.js`, `server.js`) function and interact.

### `app.js`

* **Transcription and Captioning**:
    * `virtualReceptionistSpeakerId`: A constant used to identify and filter out the virtual receptionist's own spoken text from the other speaker to avoid sending the virtual receptionist's response back to RASA.
    * `setTranscriptEvents()`: This function sets up event listeners for Webex meeting events, specifically:
        * `meeting:caption-received`: This is responsible for processing incoming transcription data. It filters captions to exclude the `virtualReceptionistSpeakerId`. The final, non-virtual-receptionist caption is then sent to the Rasa backend.
* **Rasa Integration**:
    * `sendCaptionToRasa(messageText, senderId)`: This function send the filtered transcription text to a local Rasa webhook endpoint (`http://localhost:5005/webhooks/rest/webhook`).
    * It dynamically updates the "RASA Integration" section in the UI, showing the message sent, the API call status (sending, received, error), and the response from Rasa.
    * Upon successful receipt of a text response from Rasa, it triggers the `sendTextToHeyGen()` function to vocalize the response from RASA.
* **HeyGen Integration**:
    * `HEYGEN_PROXY_BASE_ENDPOINT`: Defines the base URL for the local HeyGen proxy server (`http://localhost:3001`).
    * `getHeyGenSessionId()`: Fetches an active HeyGen streaming session ID by making a GET request to the proxy server's `/get-heygen-sessions` endpoint. This ID is essential for sending text to a Heygen through API calls.
    * `sendTextToHeyGen(text)`: Sends a given text string to the HeyGen `streaming.task` API via the local proxy. It uses the `heyGenActiveSessionId` to direct the text to the correct HeyGen session.

### `server.js`

The `server.js` file is a Node.js Express application that serves as a proxy for the HeyGen API. 
* **API Endpoints**:
    * `GET /get-heygen-sessions`: This endpoint proxies requests to HeyGen's `https://api.heygen.com/v1/streaming.list` API. .
    * `POST /send-to-heygen`: This endpoint proxies requests to HeyGen's `https://api.heygen.com/v1/streaming.task` API. It  sends the data to HeyGen, and let the avatar associated with the `session_id` to "repeat" the provided `text`.
* **Server Listening**: The server listens for incoming requests on `http://localhost:3001`.