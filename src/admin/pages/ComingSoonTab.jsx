export default function ComingSoonTab({ title }) {
    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>{title}</h2>
            </div>
            <div className="admin-soon-card">
                <div className="admin-soon-badge">Coming soon</div>
                <p>{title} module is next up on the build list.</p>
            </div>
        </div>
    )
}