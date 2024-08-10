import { Link } from "react-router-dom";
import "./landingPage.css"

export default function LandingPage() {
    return (
        <div class="centeredBox" style={{width: "640px", height: "480px"}}>
            <div class="frame" style={{width: "100%", height: "100%"}}>
                <Link to={"imageUpload"}>image mode</Link><br />
                <Link to={"imageUpload"}>webcam mode</Link>
            </div>
        </div>
    )
}