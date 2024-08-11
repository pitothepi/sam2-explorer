import { Link } from "react-router-dom";
import "./landingPage.css"

export default function LandingPage() {
    return (
        <div class="centeredBox" style={{width: "min(75%,640px)", height: "min(75%,480px)"}}>
            <div class="frame" style={{width: "100%", height: "100%"}}>
                <Link to={"imageUpload"}>image mode</Link><br />
                <Link to={"imageUpload"}>webcam mode</Link>
            </div>
        </div>
    )
}