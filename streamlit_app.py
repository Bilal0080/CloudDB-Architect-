import streamlit as st
import pandas as pd
import numpy as np
import altair as alt
import json
from datetime import datetime

# Define Page Configurations
st.set_page_config(
    page_title="Vanguard Global - CloudDB Architect Suite",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Sleek Dark Theme matching react visual layouts
st.markdown("""
    <style>
    .main {
        background-color: #0d0e12;
        color: #f1f5f9;
    }
    div[data-testid="stMetricValue"] {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24px;
        font-weight: 700;
    }
    .stSelectbox label, .stSlider label {
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 1px;
        color: #94a3b8;
    }
    pre {
        background-color: #090a0f !important;
        border: 1px solid #1e293b !important;
        border-radius: 8px !important;
    }
    </style>
""", unsafe_allow_html=True)

# ----------------- IN-MEMORY STATE & BLUEPRINTS DATABASE -----------------
PRESET_BLUEPRINTS = {
    "b2c-ecommerce": {
        "title": "B2C High-Volume Retail Store",
        "description": "Designed for standard storefront transactions, search indexes, and rapid order processing.",
        "dynamodb": {
            "tableName": "Vanguard_ECommerce_Core",
            "pk": "UserID_PK (String)",
            "sk": "SortKey_SK (String)",
            "gsis": [
                {"indexName": "GSI1_Orders", "pk": "Status_PK", "sk": "OrderDate_SK", "projection": "ALL"},
                {"indexName": "GSI2_Catalog", "p": "Category_PK", "sk": "Price_SK", "projection": "INCLUDE"}
            ],
            "keyTips": "Partition by UserID to group shopping cart profiles. Use a GSI status partition to fetch pending or paid shipments."
        },
        "aurora": {
            "tables": [
                {"name": "users", "columns": "id SERIAL PRIMARY KEY, email VARCHAR(100), tier_level VARCHAR(20)", "indexes": "PK on id"},
                {"name": "orders", "columns": "id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), amount NUMERIC, ordered_at TIMESTAMP", "indexes": "Index on user_id, ordered_at DESC"}
            ],
            "ddl": "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(100) UNIQUE NOT NULL,\n  tier_level VARCHAR(20) DEFAULT 'FREE'\n);\n\nCREATE TABLE orders (\n  id SERIAL PRIMARY KEY,\n  user_id INT REFERENCES users(id),\n  amount DECIMAL(10,2) NOT NULL,\n  ordered_at TIMESTAMP DEFAULT NOW()\n);\nCREATE INDEX idx_orders_user ON orders(user_id, ordered_at DESC);",
            "tuning": "Introduce partitioning on ordered_at for historic quarterly index lookups."
        },
        "costs": {
            "dynamodb": 34.50,
            "aurora": 72.00,
            "explanation": "At baseline rates, DynamoDB PAYG scales in proportion to queries ($34.50/mo), whilst AWS Aurora v2 PostgreSQL continuous background storage rules starts at ~1 ACU minimum ($72/mo)."
        }
    },
    "b2b-multi-tenant": {
        "title": "B2B SaaS Multi-Tenant Platform",
        "description": "Designed for isolated corporate tenancy, complex enterprise structures, and audit paths.",
        "dynamodb": {
            "tableName": "SaaSify_Tenants_Table",
            "pk": "TenantID_PK (String)",
            "sk": "SchemaType_SK (String)",
            "gsis": [
                {"indexName": "GSI1_Temporal_Audits", "pk": "TenantID_PK", "sk": "Timestamp", "projection": "ALL"},
                {"indexName": "GSI2_Global_Accounts", "pk": "UserEmail", "sk": "SK", "projection": "INCLUDE"}
            ],
            "keyTips": "Group schemas by active Tenant ID to guarantee strict software logical partition containment. Use GSI for general login cross-referencing."
        },
        "aurora": {
            "tables": [
                {"name": "tenants", "columns": "id SERIAL PRIMARY KEY, name VARCHAR(150), tier VARCHAR(20)", "indexes": "PK on id"},
                {"name": "audit_logs", "columns": "id SERIAL PRIMARY KEY, tenant_id INT REFERENCES tenants(id), activity VARCHAR(255)", "indexes": "Index on tenant_id, created_at DESC"}
            ],
            "ddl": "CREATE TABLE tenants (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(150) NOT NULL,\n  tier VARCHAR(20) DEFAULT 'STANDARD'\n);\n\nCREATE TABLE audit_logs (\n  id SERIAL PRIMARY KEY,\n  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,\n  activity VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);\nCREATE INDEX idx_logs_tenant ON audit_logs(tenant_id, created_at DESC);",
            "tuning": "Keep tenant_id coupled with timestamp sort columns in relational indexes."
        },
        "costs": {
            "dynamodb": 15.00,
            "aurora": 45.00,
            "explanation": "B2B clients operate mostly under typical office hours. DynamoDB PAYG yields maximum price minimization ($15/mo), while Aurora Serverless scales down dynamically to its 0.5 ACU baseline boundary (~$45)."
        }
    },
    "million-scale-gaming": {
        "title": "Million-Scale Global Gaming Arena",
        "description": "Capable of managing rapid ELO updates, globally shared leaderboards, and regional matchmaking.",
        "dynamodb": {
            "tableName": "RetroArena_GlobalLeaderboard",
            "pk": "RegionShard_PK (String)",
            "sk": "PlayerPoints_SK (String)",
            "gsis": [
                {"indexName": "GSI1_PlayerRecords", "pk": "PlayerID", "sk": "SK", "projection": "ALL"}
            ],
            "keyTips": "Introduce sharded region prefixes (e.g., US_EAST#SHARD_3) to circumvent partition-hotspotting limits under millisecond transactional writes."
        },
        "aurora": {
            "tables": [
                {"name": "players", "columns": "id VARCHAR(50) PRIMARY KEY, screen_name VARCHAR(100), global_rank INT, elo_score INT", "indexes": "PK on id, Index on elo_score DESC"}
            ],
            "ddl": "CREATE TABLE players (\n  id VARCHAR(50) PRIMARY KEY,\n  screen_name VARCHAR(100) NOT NULL,\n  global_rank INT DEFAULT 0,\n  elo_score INT NOT NULL DEFAULT 1200\n);\nCREATE INDEX idx_players_elo ON players(elo_score DESC);",
            "tuning": "Employ read-replicas for globally-spanning systems to limit resource exhaust on write layers."
        },
        "costs": {
            "dynamodb": 282.00,
            "aurora": 350.00,
            "explanation": "Throughput demand dictates aggressive read-write consistency. DynamoDB auto-scaling schedules provide safe expenditure tracking ($282/mo), whereas Aurora PostgreSQL employs active scaling limits (4-8 ACUs) to run concurrent queues ($350/mo)."
        }
    },
    "iot-telemetry": {
        "title": "IoT Grid Telemetry & Monitoring",
        "description": "Continuous device sensor diagnostics, time-series intervals, and system status markers.",
        "dynamodb": {
            "tableName": "GridForce_Metrics_Time_Series",
            "pk": "DeviceId_PK (String)",
            "sk": "Timestamp_SK (String)",
            "gsis": [
                {"indexName": "GSI1_Status_Alerts", "pk": "DeviceStatus", "sk": "Timestamp", "projection": "INCLUDE"}
            ],
            "keyTips": "Leverage native DynamoDB TTL parameters to securely automate historical storage purging of old device metrics."
        },
        "aurora": {
            "tables": [
                {"name": "telemetry", "columns": "id BIGSERIAL PRIMARY KEY, device_id VARCHAR(50), val NUMERIC, logged_at TIMESTAMP", "indexes": "Index on device_id, logged_at DESC"}
            ],
            "ddl": "CREATE TABLE telemetry (\n  id BIGSERIAL PRIMARY KEY,\n  device_id VARCHAR(50) NOT NULL,\n  val DECIMAL(10,2) NOT NULL,\n  logged_at TIMESTAMP DEFAULT NOW()\n);\nCREATE INDEX idx_tel_device_date ON telemetry(device_id, logged_at DESC);",
            "tuning": "Incorporate hypertable timeseries extensions (TimescaleDB) on the logged_at index column."
        },
        "costs": {
            "dynamodb": 512.00,
            "aurora": 650.00,
            "explanation": "Persistent diagnostic streams lead to write-heavy patterns. While DynamoDB is cost-effective, standard PAYG rates require provisioned billing targets to keep limits aligned. Aurora demands robust server capacities ($650/mo)."
        }
    }
}

# ----------------- SIDEBAR CONTROLS -----------------
st.sidebar.image("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop", width=80)
st.sidebar.title("Vanguard DB Architect")
st.sidebar.caption("AWS + Vercel Database Engineering Visualizer")

st.sidebar.markdown("---")

# Workload Presets
selected_preset_key = st.sidebar.selectbox(
    "1. WORKLOAD PRESET SCENARIO",
    options=list(PRESET_BLUEPRINTS.keys()),
    format_func=lambda x: PRESET_BLUEPRINTS[x]["title"]
)
preset = PRESET_BLUEPRINTS[selected_preset_key]

# Load Parameters
read_rate = st.sidebar.slider("READS THROUGHPUT (IOPS)", min_value=10, max_value=20000, value=2500, step=250)
write_rate = st.sidebar.slider("WRITES THROUGHPUT (IOPS)", min_value=10, max_value=20000, value=1200, step=200)

data_volume = st.sidebar.selectbox(
    "PROVISIONED USER STORAGE SIZE",
    options=["Light Sandbox (<10 GB)", "Highly Relational (50 GB)", "Mid Size (100 GB - 500 GB)", "Heavy (3 TB - 10 TB)", "Very Large (50 TB+)"]
)

st.sidebar.markdown("---")
st.sidebar.info("💡 **Vanguard Global Systems**: Ready for AWS Aurora v2 and DynamoDB integration blueprints.")

# ----------------- APP MAIN WORKSPACE -----------------
st.title("⚡ Project: VANGUARD GLOBAL")
st.caption("AWS Aurora PostgreSQL & DynamoDB Visual Architecture Playground (Powered by Streamlit)")

# Header Banner
st.markdown(f"""
<div style="background-color: #1a1a1f; padding: 20px; border-radius: 12px; border-left: 5px solid #3b82f6; margin-bottom: 25px;">
    <h4 style="margin: 0; color: #ffffff;">TRACK 3 STREAMLIT BLUEPRINT ENGINE</h4>
    <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">
        Deploy high-availability serverless setups using standard persistence. Selected: <strong>{preset['title']}</strong>
    </p>
</div>
""", unsafe_allow_html=True)

# ----------------- SYSTEM SPECIFIC CHARTS -----------------
st.subheader("📊 Dynamic Architectural Load Analysis & telemetry")

# Calculate dummy simulation data based on inputs
timeline = pd.date_range(end=datetime.now(), periods=15, freq='S')
reads_series = np.clip(np.random.normal(read_rate, read_rate * 0.05, 15), 10, None)
writes_series = np.clip(np.random.normal(write_rate, write_rate * 0.05, 15), 10, None)

chart_data = pd.DataFrame({
    'Time': timeline,
    'Sustained Reads': reads_series,
    'Sustained Writes': writes_series
})

# Display Metric Highlights
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Reads Throughput", f"{int(reads_series[-1])} / sec", "+12.2% drift")
with col2:
    st.metric("Writes Throughput", f"{int(writes_series[-1])} / sec", "+5.4% drift")
with col3:
    st.metric("DynamoDB Target", f"{int(read_rate / 4)} RCU / {int(write_rate / 2)} WCU", "Auto PAYG")
with col4:
    st.metric("Aurora serverless", f"{max(0.5, round((read_rate + write_rate) / 3000, 1))} ACUs", "Continuous Scale")

# Altair Chart For Throughput
c1, c2 = st.columns(2)
with c1:
    st.caption("⚡ Throughput Waveforms (Reads vs Writes)")
    melted_df = chart_data.melt('Time', var_name='Metric', value_name='IOPS')
    line_chart = alt.Chart(melted_df).mark_line().encode(
        x='Time:T',
        y='IOPS:Q',
        color='Metric:N'
    ).properties(height=240)
    st.altair_chart(line_chart, use_container_width=True)

with c2:
    st.caption("💰 Running Monthly AWS Target Cost Predictions ($)")
    prices_df = pd.DataFrame({
        'Database Engine': ['Amazon DynamoDB', 'Amazon Aurora v2'],
        'Cost ($/mo)': [preset["costs"]["dynamodb"], preset["costs"]["aurora"]]
    })
    bar_chart = alt.Chart(prices_df).mark_bar(cornerRadiusTopLeft=4, cornerRadiusTopRight=4).encode(
        x='Database Engine:N',
        y='Cost ($/mo):Q',
        color=alt.value('#10b981')
    ).properties(height=240)
    st.altair_chart(bar_chart, use_container_width=True)

# ----------------- TABS: DETAILS -----------------
st.markdown("---")
tab1, tab2, tab3 = st.tabs(["🔑 Amazon DynamoDB Layout", "🐘 AWS Aurora PostgreSQL", "🔄 Side-by-Side Comparator"])

with tab1:
    st.subheader("Amazon DynamoDB Single-Table Blueprint Specifications")
    st.info(f"📍 Table Identity: `{preset['dynamodb']['tableName']}`")
    
    st.markdown("### Core Primary Keys Configuration")
    cc1, cc2 = st.columns(2)
    with cc1:
        st.markdown(f"**Partition Key (PK):** `{preset['dynamodb']['pk']}`")
    with cc2:
        st.markdown(f"**Sort Key (SK):** `{preset['dynamodb']['sk']}`")
        
    st.markdown("### Global Secondary Indexes (GSIs)")
    gsi_df = pd.DataFrame(preset["dynamodb"]["gsis"])
    st.dataframe(gsi_df, use_container_width=True)
    
    st.markdown("💡 **Architect Keys Guideline:**")
    st.write(preset["dynamodb"]["keyTips"])

with tab2:
    st.subheader("Amazon Aurora Relational Schema Specifications")
    
    st.markdown("### Proposed Table Entities")
    for tbl in preset["aurora"]["tables"]:
        with st.expander(f"Entity Table: {tbl['name'].upper()}", expanded=True):
            st.code(f"Columns:\n{tbl['columns']}\n\nIndex Strategy: {tbl['indexes']}", language="sql")
            
    st.markdown("### Active SQL DDL Script Blueprint")
    st.code(preset["aurora"]["ddl"], language="sql")
    
    st.markdown("💡 **PostgreSQL Performance Blueprint Recommendation:**")
    st.write(preset["aurora"]["tuning"])

with tab3:
    st.subheader("Multi-Preset Side-by-Side Architecture Comparator")
    
    col_a, col_b = st.columns(2)
    with col_a:
        comp_key_a = st.selectbox("Draft Schema A (Left)", options=list(PRESET_BLUEPRINTS.keys()), index=0, key="comp_a")
        preset_a = PRESET_BLUEPRINTS[comp_key_a]
        st.markdown(f"#### {preset_a['title']}")
        st.write(preset_a["description"])
        st.metric("Estimated DynamoDB Cost", f"${preset_a['costs']['dynamodb']:.2f}")
        st.metric("Estimated Aurora Cost", f"${preset_a['costs']['aurora']:.2f}")
        st.write("🔧 **DynamoDB Table Keying Structure:**")
        st.code(f"PK: {preset_a['dynamodb']['pk']}\nSK: {preset_a['dynamodb']['sk']}")
        
    with col_b:
        comp_key_b = st.selectbox("Draft Schema B (Right)", options=list(PRESET_BLUEPRINTS.keys()), index=1, key="comp_b")
        preset_b = PRESET_BLUEPRINTS[comp_key_b]
        st.markdown(f"#### {preset_b['title']}")
        st.write(preset_b["description"])
        st.metric("Estimated DynamoDB Cost", f"${preset_b['costs']['dynamodb']:.2f}")
        st.metric("Estimated Aurora Cost", f"${preset_b['costs']['aurora']:.2f}")
        st.write("🔧 **DynamoDB Table Keying Structure:**")
        st.code(f"PK: {preset_b['dynamodb']['pk']}\nSK: {preset_b['dynamodb']['sk']}")

st.markdown("---")
st.caption("© 2026 CloudDB Architect Visualizer Suite. Exported specifically for Streamlit Cloud deployment.")
